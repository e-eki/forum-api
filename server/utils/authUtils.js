'use strict';

const Promise = require('bluebird');
const axios = require('axios');
const qs = require('qs');
const config = require('../config');
const userModel = require('../mongoDB/models/user');
const utils = require('./baseUtils');
const errors = require('./errors');

// методы ищут юзера по email при входе через сайт/вк/гугл
const authUtils = new function() {

	// получить юзера при входе через сайт
	this.getUserBySiteAuth = function(email, password) {
		//find user with this email
		return Promise.resolve(userModel.query({email: email}))
			.then(results => {	
				if (!results.length) {
					throw utils.initError(errors.VALIDATION_ERROR, 'No user with this email');
				}

				const user = results[0];
				let tasks = [];

				tasks.push(user);

				tasks.push(utils.comparePassword(password, user.password));

				return Promise.all(tasks);
			})
			.spread((user, passwordIsCorrect) => {
				//check password
				if (passwordIsCorrect === false) {
					throw utils.initError(errors.UNAUTHORIZED, 'incorrect password');
				}

				return user;
			})
	};

	// получить юзера при входе через вк
	this.getUserByVkAuth = function(code) {
		//send request to vk api to get access_token & email
		return axios.get(
			'https://oauth.vk.com/access_token?'
			, {
				params: {
					client_id: config.vk.clientId
					, client_secret: config.vk.secret
					, code: code
					, redirect_uri: config.socialRedirectUri
				}
			})
			.then(response => {			
				//validate vk response
				if (!response.data.email || response.data.email == '') {
					throw utils.initError(errors.FORBIDDEN, 'incorrect vk auth data: empty user email');
				}					

				const userEmail = response.data.email;
				return userModel.query({email: userEmail});
			})
			.then(results => {
				if (!results.length) {
					throw utils.initError(errors.FORBIDDEN, 'incorrect vk auth data: no user with this email');
				}

				const user = results[0];

				return user;
			})
	};

	// получить юзера при входе через гугл
	this.getUserByGoogleAuth = function(code) {
		//send request to google+ api to get access_token
		return Promise.resolve(true)
			.then(() => {
				const params = {
					code: code
					, client_id: config.google.clientId
					, client_secret: config.google.secret
					, redirect_uri: config.socialRedirectUri
					, grant_type: config.google.grantType
				};

				const options = {
					method: 'POST',
					headers: { 'content-type': 'application/x-www-form-urlencoded' },
					data: qs.stringify(params),
					url: 'https://accounts.google.com/o/oauth2/token'
				};

				return axios(options);
			})
			.then(response => {				
				//validate google response
				if (!response.data.access_token || response.data.access_token == '') {
					throw utils.initError(errors.FORBIDDEN, 'incorrect google auth data: empty access_token');
				}

				//send request to google+ api to get email (user data)
				return axios.get(
					'https://www.googleapis.com/oauth2/v1/userinfo?'
					, {
						params: {
							access_token: response.data.access_token
						}
					});
			})
			.then(response => {
				//validate google response
				if (!response.data.email || response.data.email == '')  {
					throw utils.initError(errors.FORBIDDEN, 'incorrect google auth data: empty user email');
				}

				const userEmail = response.data.email;
				return userModel.query({email: userEmail});
			})
			.then(results => {
				if (!results.length) {
					throw utils.initError(errors.FORBIDDEN, 'incorrect google auth data: no user with this email');
				}

				const user = results[0];

				return user;
			})
	};
};

module.exports = authUtils;