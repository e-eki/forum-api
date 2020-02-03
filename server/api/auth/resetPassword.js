'use strict';

const express = require('express');
const Promise = require('bluebird');
const uuidV4 = require('uuidv4');
const config = require('../../config');
const utils = require('../../utils/baseUtils');
const logUtils = require('../../utils/logUtils');
const mailUtils = require('../../utils/mailUtils');
const tokenUtils = require('../../utils/tokenUtils');
const sessionUtils = require('../../utils/sessionUtils');
const userModel = require('../../mongoDB/models/user');
const userInfoModel = require('../../mongoDB/models/userInfo');
const resetDataModel = require('../../mongoDB/models/resetPasswordData');
const errors = require('../../utils/errors');
const responses = require('../../utils/responses');
const rightsUtils = require('../../utils/rightsUtils');

let router = express.Router();

//----- endpoint: /api/auth/reset-password/
router.route('/reset-password/')

	.get(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
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

				// проверяем права
				if (!rightsUtils.isRightsValid(user)) {
					throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
				}

				//для каждого юзера генерится уникальный код сброса пароля и записывается в БД
				const resetPasswordCode = uuidV4.uuid();
				user.resetPasswordCode = resetPasswordCode;

				const tasks = [];

				tasks.push(user);

				tasks.push(userInfoModel.query({userId : user.id}));

				return Promise.all(tasks);
			})
			.spread((user, results) => {
				const login = results.length ? results[0].login : '';

				const data = {
					login: login,
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
				logUtils.fileLogDbErrors(dbResponses);

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
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);

				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(user => {
				// проверяем права
				if (!user ||
					!rightsUtils.isRightsValid(user)) {
						throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
				}

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
				logUtils.fileLogDbErrors(dbResponse);

				const tasks = [];
				tasks.push(user.id);

				tasks.push(resetDataModel.query({email: user.email}));

				return Promise.all(tasks);
			})
			.spread((userId, resetDatas) => {
				const tasks = [];
				tasks.push(userId);

				// удаляем все данные о запросах юзером письма с кодом сброса пароля  (надо ли???)
				if (resetDatas.length) {
					resetDatas.forEach(item => {
						tasks.push(resetDataModel.delete(item.id));
					})
				}

				return Promise.all(tasks);
			})
			.spread((userId, dbResponses) => {
				logUtils.fileLogDbErrors(dbResponses);

				// удаляем все сессии юзера, а срок действия его access токена закончится сам
				// после смены пароля надо заново логиниться
				// (??? либо принудительно после того, как закончится access token)
				return sessionUtils.deleteAllUserSessions(userId);
			})
			.then(result => {
				return utils.sendResponse(res, 'Password reset successfully', responses.CREATED_RESPONSE.status);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	.delete(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})
;

//----- endpoint: /api/auth/reset-password/:code
router.route('/reset-password/:code')

	// сюда приходит запрос на сброс пароля по ссылке из письма
	.get(function(req, res) {
		let user;
		let fingerprint;

		// ищем юзеров с данным кодом сброса пароля
		return Promise.resolve(userModel.query({resetPasswordCode: req.params.code}))
			.then((users) => {
				if (!users.length) {
					throw utils.initError('FORBIDDEN');
				}

				// по идее должен быть один юзер на один код сброса пароля
				user = users[0];

				// проверяем права
				if (!user ||
					!rightsUtils.isRightsValid(user)) {
						throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
				}

				user.resetPasswordCode = null;

				const tasks = [];

				tasks.push(userModel.update(user.id, user));

				tasks.push(resetDataModel.query({email: user.email}));

				return Promise.all(tasks);
			})
			.spread((dbResponse, resetDatas) => {
				logUtils.fileLogDbErrors(dbResponse);

				if (!resetDatas.length) {
					throw utils.initError('FORBIDDEN');
				}

				// для создания сессии нужен fingerprint -
				// берем его из последних данных о запросе письма с кодом сброса пароля (?)
				fingerprint = resetDatas[resetDatas.length - 1].fingerprint;   //?

				const tasks = [];

				// удаляем все данные о запросах юзером письма с кодом сброса пароля
				resetDatas.forEach(item => {
					tasks.push(resetDataModel.delete(item.id));
				})

				return Promise.all(tasks);
			})
			.then(dbResponses => {
				logUtils.fileLogDbErrors(dbResponses);

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
				//todo!
				const link = `${config.server.protocol}://${config.server.host}:${config.server.port}/${config.apiRoutes.resetPassword}/${tokensData.accessToken}`;
				return res.redirect(`${link}`);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	.post(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

	.put(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

	.delete(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})
;

module.exports = router;