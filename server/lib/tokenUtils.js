'use strict';

const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const refreshTokenModel = require('../models/refreshToken');
const userModel = require('../models/user');
const utils = require('./utils');

const tokenUtils = new function() {

	// генерит аксесс токен
	this.getAccessToken = function(user) {
		let payload = {
			userId: user.id,
			userRole: user.role,
		};

		let options = {
			algorithm: 'HS512',
			expiresIn: config.token.access.expiresIn.toString(),
			subject: 'access'
		};

		return jwt.sign(payload, config.token.secret, options);
	};

	// генерит время жизни аксесс токена
	this.getAccessTokenExpiresIn = function() {
		let now = new Date().getTime();
		return (now + config.token.access.expiresIn);
	};

	// генерит рефреш токен
	this.getRefreshToken = function(user) {
		let payload = {
			userId: user.id,
		};

		let options = {
			algorithm: 'HS512',
			expiresIn: config.token.refresh.expiresIn.toString(),
			subject: 'refresh'
		};

		return jwt.sign(payload, config.token.secret, options);
	};

	// генерит время жизни рефреш токена
	/*this.getRefreshTokenExpiresIn = function() {
		let now = new Date().getTime();
		return (now + config.token.refresh.expiresIn);
	};*/

	// получает из заголовка ответа токен
	this.getTokenFromHeader = function(headerAuthorization) {
		//TODO - Regex?
		const parts = headerAuthorization.split(' ');
		const accessToken = (parts.length && parts[1]) ? parts[1] : '';

		return accessToken;
	};

	/*this.decodeToken = function(token) {
		let options = {
			json: true,
			complete: true,
		};
		return jwt.decode(token, options);
	},*/

	// проверяет access token
	this.verifyAccessToken = function(token) {
		return this.verifyToken(token, 'access');
	};

	// проверяет refresh token
	this.verifyRefreshToken = function(token) {
		return this.verifyToken(token, 'refresh');
	}

	//проверяет токен (сигнатуру и срок действия) и возращает декодированный payload, если токен валидный
	this.verifyToken = function(token, tokenType) {
		//проверка на тип токена, записанный в subject
		let subject = (tokenType == 'access') ? 'access' : 'refresh';

		return jwt.verify(token, config.token.secret, {subject: subject}, function(error, payload) {			
			if (error || tokenType == 'access') return {error: error, payload: payload};   // костыль для заворачивания в промис
			
			// ищем в БД рефреш токен для этого юзера
			return Promise.resolve(refreshTokenModel.query({userId: payload.userId}))
				.then((refreshToken) => {
					// сравниваем рефреш токены
					//token = token.toString();
					//TODO: как сравнить токены? сравнение строк не работает
					//if (!refreshToken || token > refreshToken[0].toString() || token < refreshToken[0].toString()) throw new Error('bad refresh token');
					
					if (!refreshToken[0]) {
						error = Error('bad refresh token');
					}
					return {error: error, payload: payload};
				})
		});
	};

	// удаляет все рефреш токены из БД для данного юзера
	this.deleteAllRefreshTokens = function(userId) {
		//find refresh tokens
		return Promise.resolve(refreshTokenModel.query({userId: userId}))
			.then((refreshTokens) => {				
				if (!refreshTokens.length) return true;

				let tasks = [];				
				// delete all tokens
				refreshTokens.forEach((token) => {
					tasks.push(refreshTokenModel.delete(token.id));
				})

				return Promise.all(tasks);
			})
			.then((dbResponses) => {
				if (dbResponses == true) return 'no refresh tokens for user';

				dbResponses.forEach((dbResponse) => {
					if (dbResponse.errors) {
						// log errors
						utils.logDbErrors(dbResponse.errors);
					};
				});

				return 'all refresh tokens for user deleted';
			})
	};

	// генерит новые токены (аксесс, рефреш и время жизни аксесса) и сохраняет в БД рефреш токен
	this.getRefreshTokensAndSaveToDB = function(user) {
		// get tokens
		let tasks = [];

		tasks.push(user);
		tasks.push(tokenUtils.getAccessToken(user));
		tasks.push(tokenUtils.getAccessTokenExpiresIn());
		tasks.push(tokenUtils.getRefreshToken(user));

		return Promise.all(tasks)
			.spread((user, accessToken, accessTokenExpiresIn, refreshToken) => {
				// validate tokens
				if (!accessToken || accessToken == '') {
					throw utils.initError('INTERNAL_SERVER_ERROR', 'token error: tokens generate error');
				}
				if (!refreshToken || refreshToken == '') {
					throw utils.initError('INTERNAL_SERVER_ERROR', 'token error: tokens generate error');
				}

				let tasks = [];
				//save refresh token to DB
				let refreshTokenData = {
					userId: user.id,
					refreshToken: refreshToken
				};
				tasks.push(refreshTokenModel.create(refreshTokenData));
				//tokens data will send to user
				let tokensData = {
					accessToken: accessToken,
					refreshToken: refreshToken,
					expires_in: accessTokenExpiresIn,
				};
				tasks.push(tokensData);

				return Promise.all(tasks);
			})
			.spread((dbResponse, tokensData) => {
				if (dbResponse.errors) {
					utils.logDbErrors(dbResponse.errors);

					// ? если в БД не удалось сохранить рефреш токен - то ошибка, надо повторить всё сначала
					throw utils.initError('INTERNAL_SERVER_ERROR', 'token error: tokens generate error');
				}

				return tokensData;
			});
	};

	// проверяет аксесс токен и находит по нему юзера
	this.findUserByAccessToken = function(accessToken) {

		return Promise.resolve(true)
			.then(() => {
				//validate & decode token
				return this.verifyAccessToken(accessToken)
			})
			.then((result) => {					
				if (result.error || !result.payload) {
					throw utils.initError('FORBIDDEN', 'token error: invalid access token: ' + result.error.message);
				}

				// get user
				return userModel.query({_id: result.payload.userId});
			})
			.then((userData) => {
				if (!userData.length)  {
					throw utils.initError('FORBIDDEN', 'no user with this access token');
				}

				const user = userData[0];
				return user;
			})
	};

};

module.exports = tokenUtils;