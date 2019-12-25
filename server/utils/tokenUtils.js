'use strict';

const Promise = require('bluebird');
const uuidV4 = require('uuidv4');
const jwt = require('jsonwebtoken');
const config = require('../config');
const utils = require('./baseUtils');

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
		return jwt.verify(token, config.token.secret, function(error, payload) {			
			if (error || tokenType == 'access') return {error: error, payload: payload}});
	};

	// проверка аксесс токена на валидность
	this.isAccessTokenValid = function(token, userRole) {
		return this.decodeAccessToken(token)
			.then(result => {  //?
				if (result.error || !result.payload ||
					!result.payload.tokenType || !result.payload.expiresIn || !result.payload.userId || !result.payload.userRole) {
					return false;
				}

				if ((result.payload.tokenType !== config.token.access.type) ||
					(userRole && (result.payload.userRole !== userRole)) ||
					(result.payload.expiresIn < new Date().getTime())) {
						return false;
				}

				return true; //todo: get userId
			})
	}

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


	// // проверяет аксесс токен и находит по нему юзера
	// this.findUserByAccessToken = function(accessToken) {

	// 	return Promise.resolve(true)
	// 		.then(() => {
	// 			//validate & decode token
	// 			return this.verifyAccessToken(accessToken)
	// 		})
	// 		.then((result) => {					
	// 			if (result.error || !result.payload) {
	// 				throw utils.initError('FORBIDDEN', 'token error: invalid access token: ' + result.error.message);
	// 			}

	// 			// get user
	// 			return userModel.query({_id: result.payload.userId});
	// 		})
	// 		.then((userData) => {
	// 			if (!userData.length)  {
	// 				throw utils.initError('FORBIDDEN', 'no user with this access token');
	// 			}

	// 			const user = userData[0];
	// 			return user;
	// 		})
	// };
};

module.exports = tokenUtils;