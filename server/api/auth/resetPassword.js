'use strict';

const express = require('express');
const Promise = require('bluebird');
const uuidV4 = require('uuidv4');
const config = require('../../config');
const utils = require('../../utils/baseUtils');
const mailUtils = require('../../utils/mailUtils');
const tokenUtils = require('../../utils/tokenUtils');
const sessionUtils = require('../../utils/sessionUtils');
const userModel = require('../../mongoDB/models/user');
const resetDataModel = require('../../mongoDB/models/resetPasswordData');
const errors = require('../../utils/errors');

let router = express.Router();

//----- endpoint: /api/auth/reset-password/
router.route('/reset-password/')

	.get(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

	//запрос письма с кодом сброса пароля 
	/* data = {
		email,
		fingerprint
	}*/
	.post(function(req, res) {
		let user;

		return Promise.resolve(true)
			.then(() => {
				const validationErrors = [];

				//validate req.body
				if (!req.body.email || req.body.email == '') {
					throw utils.initError(errors.VALIDATION_ERROR, 'empty email');
				}
				if (!req.body.fingerprint || req.body.fingerprint == '') {
					validationErrors.push('empty device data');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError(errors.VALIDATION_ERROR, validationErrors);
				}

				// проверяем количество уже сделанных запросов на сброс пароля с этого устройства,
				// если их количество = макс.допустимому, то все последующие не обрабатывать
				return resetDataModel.query({fingerprint: req.body.fingerprint, getCount: true});
			})
			.then(resetDataCount => {
				if (resetDataCount >= config.security.resetPasswordLettersMaxCount) {
					throw utils.initError(errors.VALIDATION_ERROR, 'Количество запросов на сброс пароля с данного устройства больше допустимого. Обратитесь к администратору сайта.');
				}

				// ищем юзера с таким имейлом
				return userModel.query({email: req.body.email});
			})
			.then(results => {
				if (!results.length) {
					throw utils.initError(errors.VALIDATION_ERROR, 'No user with this email');
				}
				
				user = results[0];
				//для каждого юзера генерится уникальный код сброса пароля и записывается в БД
				const resetPasswordCode = uuidV4.uuid();
				user.resetPasswordCode = resetPasswordCode; 

				const data = {
					login: user.login,
					email: user.email,
					resetPasswordCode: user.resetPasswordCode
				};

				//отправляем письмо с кодом сброса пароля на указанный имейл
				return mailUtils.sendResetPasswordLetter(data)
					.catch(error => {
						// возможная ошибка на этапе отправки письма
						throw utils.initError(errors.INVALID_INPUT_DATA, 'Email not exists');					
					})
			})
			.then(result => {
				const tasks = [];

				// создаем данные о запросе письма со сбросом пароля
				const resetData = {
					email: req.body.email,
					fingerprint: req.body.fingerprint,
				};

				tasks.push(resetDataModel.create(resetData));

				// если письмо отправилось - записываем код сброса пароля в user
				tasks.push(userModel.update(user.id, user));

				return Promise.all(tasks);
			})
			.then(dbResponses => {
				utils.logDbErrors(dbResponses);

				return utils.sendResponse(res, 'Письмо с инструкциями по сбросу пароля отправлено на указанный имейл');
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	//изменение пароля юзером на странице сброса пароля (на нее можно перейти из лк)
	/*data = {
		accessToken,
		password,
		oldPassword     //todo!
	}*/
	.put(function(req, res) {
		return Promise.resolve(true)
			.then(() => {
				const validationErrors = [];

				//validate req.body
				if (!req.body.password || req.body.password == '') {
					validationErrors.push('empty password');
				}
				if (!req.body.oldPassword || req.body.oldPassword == '') {
					validationErrors.push('empty old password');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError(errors.VALIDATION_ERROR, validationErrors);
				}

				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getTokenFromHeader(headerAuthorization);

				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(user => {
				const tasks = [];
				tasks.push(user);

				// проверка соответствия старого пароля
				tasks.push(utils.comparePassword(req.body.oldPassword, user.password));

				return Promise.all(tasks);
			})
			.spread((user, passwordIsCorrect) => {
				//check password
				if (passwordIsCorrect === false) {
					throw utils.initError(errors.FORBIDDEN, 'incorrect old password');
				}
				
				const tasks = [];
				tasks.push(user);

				//получаем хэш нового пароля
				tasks.push(utils.makePasswordHash(req.body.password));

				return Promise.all(tasks);
			})
			.spread((user, hash) => {
				const userData = {
					email: user.email,
					password: hash,
					resetPasswordCode: null,
					role: user.role,
					inBlackList: user.inBlackList,
				};

				let tasks = [];
				tasks.push(user);
				tasks.push(userModel.update(user.id, userData));

				return Promise.all(tasks);
			})
			.spread((user, dbResponse) => {
				utils.logDbErrors(dbResponse);

				const tasks = [];
				tasks.push(user.id);

				tasks.push(resetDataModel.query({email: user.email}));

				return Promise.all(tasks);
			})
			.spread((userId, resetDatas) => {
				const tasks = [];

				// удаляем все данные о запросах юзером письма с кодом сброса пароля
				if (resetDatas.length) {
					resetDatas.forEach(item => {
						tasks.push(resetDataModel.delete(item.id));
					})
				}

				return Promise.all(tasks);
			})
			.then(dbResponses => {
				utils.logDbErrors(dbResponses);

				// удаляем все сессии юзера, а срок действия его access токена закончится сам
				// после смены пароля надо заново логиниться
				// (??? либо принудительно после того, как закончится access token)
				return sessionUtils.deleteAllUserSessions(userId);
			})
			.then(result => {
				return utils.sendResponse(res, 'Password reset successfully', 201);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	.delete(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})
;

//----- endpoint: /api/auth/reset-password/:uuid
router.route('/reset-password/:uuid')

	// сюда приходит запрос на сброс пароля по ссылке из письма
	.get(function(req, res) {
		let user;
		let fingerprint;

		// ищем юзеров с данным кодом сброса пароля
		return Promise.resolve(userModel.query({resetPasswordCode: req.params.uuid}))
			.then((users) => {
				if (!users.length) {
					throw utils.initError('FORBIDDEN');
				}

				// по идее должен быть один юзер на один код сброса пароля
				user = users[0];
				user.resetPasswordCode = null;

				const tasks = [];

				tasks.push(userModel.update(user.id, user));

				tasks.push(resetDataModel.query({email: user.email}));

				return Promise.all(tasks);
			})
			.spread((dbResponse, resetDatas) => {
				utils.logDbErrors(dbResponse);

				if (!resetDatas.length) {
					throw utils.initError('FORBIDDEN');
				}

				fingerprint = resetDatas[resetDatas.length - 1].fingerprint;   //?

				const tasks = [];

				// удаляем все данные о запросах юзером письма с кодом сброса пароля
				resetDatas.forEach(item => {
					tasks.push(item.id);
				})

				return Promise.all(tasks);
			})
			.then(dbResponses => {
				utils.logDbErrors(dbResponse);

				// удаляем все сессии юзера
				return sessionUtils.deleteAllUserSessions(user.id);
			})
			.then(result => {
				// для создания сессии нужен fingerprint - берем его из последних данных о запросе письма с кодом сброса пароля (?)
				// создаем новую сессию
				return sessionUtils.addNewSessionAndGetTokensData(user, fingerprint);
			})
			.then(tokensData => {
				// как передать токены, одновременно открыв страницу сброса пароля:
				// передаем аксесс токен как параметр в ссылке, фронт-энд этот параметр извлекает 
				// и использует для запроса на сброс пароля
				// рефреш токен и время жизни ему не нужны, т.к когда истечет время жизни - 
				// протухнет ссылка, и новую можно получить только в новом письме.

				// редиректим на страницу сброса пароля
				const link = `${config.server.protocol}://${config.server.host}:${config.server.port}/${config.apiRoutes.resetPassword}/${tokensData.accessToken}`;
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