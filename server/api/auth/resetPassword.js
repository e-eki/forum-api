'use strict';

const express = require('express');
const Promise = require('bluebird');
const config = require('../../config');
const utils = require('../lib/utils');
const mail = require('../lib/mail');
const tokenUtils = require('../lib/tokenUtils');
const userModel = require('../models/user');

let router = express.Router();

//----- endpoint: /api/resetpassword/
router.route('/resetpassword/')

	.get(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

	//запрос письмо с кодом на сброс пароля 
	/* data = {
		email: <email>
	}*/
	.post(function(req, res) {
		let user;

		return Promise.resolve(true)
			.then(() => {
				//validate req.body
				if (!req.body.email || req.body.email == '') {
					throw utils.initError('VALIDATION_ERROR', 'empty email');
				}

				const email = req.body.email;
				// ищем юзера с таким имейлом
				return userModel.query({email: email});
			})
			.then((userData) => {
				if (!userData.length) {
					throw utils.initError('FORBIDDEN', 'No user with this email');
				}
				
				user = userData[0];
				//для каждого юзера генерится уникальный код сброса пароля и записывается в БД
				const resetPasswordCode = utils.makeUId(user.login + user.email + Date.now());
				user.resetPasswordCode = resetPasswordCode; 

				const data = {
					login: user.login,
					email: user.email,
					resetPasswordCode: user.resetPasswordCode
				};

				//отправляем письмо с кодом сброса пароля на указанный имейл
				return mail.sendResetPasswordLetter(data)
					.catch((error) => {
						// возможная ошибка на этапе отправки письма
						throw utils.initError('INVALID_INPUT_DATA', 'Email not exists');					
					})
			})
			.then((data) => {
				// если письмо отправилось без ошибок - то записываем код сброса пароля в БД
				return userModel.update(user._id, user);
			})
			.then((dbResponse) => {
				if (dbResponse.errors) {
					throw utils.initError('INTERNAL_SERVER_ERROR', 'reset password error');
				}
				return utils.sendResponse(res, 'Reset password mail send');
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	//изменение пароля юзером на странице сброса пароля (на нее можно перейти из лк или по ссылке на сброс пароля)
	/*data = {
		accessToken,
		newPassword
	}*/
	.put(function(req, res) {
		let newPassword;

		return Promise.resolve(true)
			.then(() => {
				//validate req.body
				if (!req.body.password || req.body.password == '') {
					throw utils.initError('VALIDATION_ERROR', 'empty new password');
				}

				newPassword = req.body.password;

				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getTokenFromHeader(headerAuthorization);

				return tokenUtils.findUserByAccessToken(accessToken);
			})
			.then((user) => {
				if (!user.isEmailConfirmed) {
					throw utils.initError('UNAUTHORIZED', 'email not confirmed');
				}

				let tasks = [];
				tasks.push(user);
				//получаем хэш нового пароля
				tasks.push(utils.makePasswordHash(newPassword));

				return Promise.all(tasks);
			})
			.spread((user, hash) => {
				const userData = {
					login     : user.login,
					email     : user.email,
					confirmEmailCode: user.confirmEmailCode,
					isEmailConfirmed: user.isEmailConfirmed,
					password     : hash,
					resetPasswordCode: '',
					role: user.role,
				};

				let tasks = [];
				tasks.push(user.id);
				tasks.push(userModel.update(user.id, userData));

				return Promise.all(tasks);
			})
			.spread((userId, dbResponse) => {
				if (dbResponse.errors) {
					utils.logDbErrors(dbResponse.errors);
					throw utils.initError('INTERNAL_SERVER_ERROR', 'reset password error');
				}

				// удаляем из БД все рефреш токены юзера, а срок действия его access токена закончится сам
				// после смены пароля надо заново логиниться (?? либо принудительно после того, как закончится access token)
				return tokenUtils.deleteAllRefreshTokens(userId);
			})
			.then(() => {
				return utils.sendResponse(res, 'Password reset');
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	.delete(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})
;

//----- endpoint: /api/resetpassword/:uuid
router.route('/resetpassword/:uuid')

	// сюда приходит запрос на сброс пароля по ссылке из письма
	.get(function(req, res) {
		// ищем юзеров с данным кодом сброса пароля
		return Promise.resolve(userModel.query({resetPasswordCode: req.params.uuid}))
			.then((users) => {
				if (!users.length) {
					throw utils.initError('FORBIDDEN', 'no user with this uuid');
				}

				// по идее должен быть один юзер на один код сброса пароля
				const user = users[0];
				user.resetPasswordCode = '';

				let tasks = [];
				tasks.push(user);
				tasks.push(userModel.update(user._id, user));

				return Promise.all(tasks);
			})
			.spread((user, dbResponse) => {
				if (dbResponse.errors) {
					// log errors
					utils.logDbErrors(dbResponse.errors);
				};
				
				// редиректим на страницу сброса пароля
				//const mainLink = `${config.server.protocol}://${config.server.host}:${config.server.port}/resetPassword`;
				//return res.redirect(`${mainLink}`);

				// --------- выдаем токены юзеру (редиректит фронт-энд)
				let tasks = [];
				tasks.push(user);

				//удаляем все рефреш токены для данного юзера - можно залогиниться только на одном устройстве, 
				// на других в это время разлогинивается
				tasks.push(tokenUtils.deleteAllRefreshTokens(user.id));

				return Promise.all(tasks);
			})
			.spread((user, data) => {
				// получаем новую пару токенов
				return tokenUtils.getRefreshTokensAndSaveToDB(user);
			})
			.then((tokensData) => {
				// как передать токены, одновременно открыв страницу сброса пароля:
				// передаем аксесс токен как параметр в ссылке, фронт-энд этот параметр извлекает 
				// и использует для запроса на сброс пароля
				// рефреш токен и время жизни ему не нужны, т.к когда истечет время жизни - 
				// протухнет ссылка, и новую можно получить только в новом письме.

				// редиректим на страницу сброса пароля
				const link = `${config.server.protocol}://${config.server.host}:${config.server.port}/resetPassword/${tokensData.accessToken}`;
				return res.redirect(`${link}`);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	.post(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

	.put(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

	.delete(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})
;

module.exports = router;