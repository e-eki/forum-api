'use strict';

const Promise = require('bluebird');
const uuidV4 = require('uuidv4');
const jwt = require('jsonwebtoken');
const config = require('../config');
const utils = require('./baseUtils');
const userModel = require('../mongoDB/models/user');
const errors = require('../utils/errors');

const tokenUtils = new function() {

	// генерит аксесс токен
	this.getAccessToken = function(user) {
		const expiresIn = this.getAccessTokenExpiresIn();

		const payload = {
			tokenType: config.token.access.type, //?
			expiresIn: expiresIn,   //! время жизни д.б. быть внутри аксесс токена, тк его нельзя изменить!
			userId: user.id,
			userRole: user.role,
		};

		const options = {
			algorithm: config.token.algorithm,
		};

		return jwt.sign(payload, config.token.secret, options);
	};

	// генерит время жизни аксесс токена
	this.getAccessTokenExpiresIn = function() {
		const now = new Date().getTime();
		return (now + config.token.access.expiresIn);
	};

	// генерит рефреш токен
	this.getRefreshToken = function() {
		const token = uuidV4.uuid();
		return token;
	};

	// генерит время жизни рефреш токена
	this.getRefreshTokenExpiresIn = function() {
		const now = new Date().getTime();
		return (now + config.token.refresh.expiresIn);
	};

	// расшифровка аксесс токена
	this.decodeAccessToken = function(token) {
		return jwt.verify(token, config.token.secret, 
			function(error, payload) {			
				return {error: error, payload: payload};   // костыль для заворачивания в промис);
		})
	};

	// проверка payload аксесс токена на валидность
	this.isAccessTokenValid = function(payload, userRole) {
		if (!payload.tokenType || !payload.expiresIn || !payload.userId || !payload.userRole) {
			return false;
		}

		if ((payload.tokenType !== config.token.access.type) ||
			(userRole && (payload.userRole !== userRole)) ||
			(payload.expiresIn < new Date().getTime())) {
				return false;
		}

		return true;
	}

	// // проверка аксесс токена на валидность
	// this.isAccessTokenValid = function(token, userRole) {
	// 	return this.decodeAccessToken(token)
	// 		.then(result => {  //?
	// 			if (result.error || !result.payload ||
	// 				!result.payload.tokenType || !result.payload.expiresIn || !result.payload.userId || !result.payload.userRole) {
	// 				return false;
	// 			}

	// 			if ((result.payload.tokenType !== config.token.access.type) ||
	// 				(userRole && (result.payload.userRole !== userRole)) ||
	// 				(result.payload.expiresIn < new Date().getTime())) {
	// 					return false;
	// 			}

	// 			return true; //todo: get userId
	// 		})
	// }

	// получить новый аксесс, рефреш токен и время жизни рефреша
	this.getTokensData = function(user) {
		const tasks = [];

		tasks.push(this.getAccessToken(user));
		tasks.push(this.getRefreshToken());
		tasks.push(this.getRefreshTokenExpiresIn());

		return Promise.all(tasks)
			.spread((accessToken, refreshToken, refreshTokenExpiresIn) => {
				const tokensData = {
					accessToken: accessToken,
					refreshToken: refreshToken,
					expiresIn: refreshTokenExpiresIn,  //время жизни сессии = времени жизни рефреш токена
				};

				return tokensData;
			})
	}

	// получает из заголовка ответа аксесс токен
	this.getAccessTokenFromHeader = function(headerAuthorization) {
		//TODO - Regex?
		const parts = headerAuthorization.split(' ');
		const accessToken = (parts.length && parts[1]) ? parts[1] : '';

		return accessToken;
	};

	// проверяет аксесс токен и находит по нему юзера
	this.checkAccessTokenAndGetUser = function(accessToken) {
		return Promise.resolve(true)
			.then(() => {
				//decode token
				return this.decodeAccessToken(accessToken);
			})
			.then(result => {					
				if (result.error || !result.payload) {
					throw utils.initError(errors.FORBIDDEN, 'invalid access token');
				}

				const tasks = [];
				tasks.push(result.payload.userId);

				tasks.push(this.isAccessTokenValid(result.payload));

				return Promise.all(tasks);
			})
			.spread((userId, isValid) => {
				if (!isValid) {
					throw utils.initError(errors.FORBIDDEN, 'invalid access token');
				}

				// get user
				return userModel.query({id: result.payload.userId});
			})
			.then(results => {
				if (!results.length)  {
					throw utils.initError('FORBIDDEN', 'invalid access token');
				}

				const user = results[0];
				return user;
			})
	};
};

module.exports = tokenUtils;