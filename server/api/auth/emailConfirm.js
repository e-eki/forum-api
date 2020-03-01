'use strict';

const Promise = require('bluebird');
const express = require('express');
const config = require('../../config');
const utils = require('../../utils/baseUtils');
const logUtils = require('../../utils/logUtils');
const mailUtils = require('../../utils/mailUtils');
const regDataModel = require('../../mongoDB/models/registrationData');
const userModel = require('../../mongoDB/models/user');
const userInfoModel = require('../../mongoDB/models/userInfo');
const userVisitDataModel = require('../../mongoDB/models/userVisitData');
const errors = require('../../utils/errors');
const confirmDataModel = require('../../mongoDB/models/emailConfirmData');

let router = express.Router();

//----- endpoint: /api/auth/email-confirm/
router.route('/email-confirm/')

	.get(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

	//запрос на повторное подтверждение почты пользователя
	/* data = {
		email,
		fingerprint
	}*/
	.post(function(req, res) {
		return Promise.resolve(true)
			.then(() => {
				//validate req.body
				const validationErrors = [];

				if (!req.body.email || req.body.email == '') {
					validationErrors.push('empty email');
				}
				if (!req.body.fingerprint || req.body.fingerprint == '') {
					validationErrors.push('empty device data');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError(errors.VALIDATION_ERROR, validationErrors);
				}

				// проверяем количество уже сделанных запросов на повторное подтверждение с этого устройства,
				// если их количество = макс.допустимому, то все последующие не обрабатывать
				return confirmDataModel.query({fingerprint: req.body.fingerprint, getCount: true});
			})
			.then(confirmDataCount => {
				if (confirmDataCount >= config.security.emailConfirmLettersMaxCount) {
					throw utils.initError(errors.VALIDATION_ERROR, 'Количество запросов на повторное подтверждение почты с данного устройства больше допустимого. Обратитесь к администратору сайта.');
				}

				// ищем уже зарегистрированного юзера с таким имейлом
				return userModel.query({email: req.body.email});
			})
			.then(results => {
				if (results.length) {
					throw utils.initError(errors.VALIDATION_ERROR, 'Указанный имейл уже подтвержден');
				}

				// ищем попытки регистрации с таким имейлом
				return regDataModel.query({email: req.body.email});
			})
			.then(results => {
				if (!results.length) {
					throw utils.initError(errors.VALIDATION_ERROR, 'С указанным имейлом еще не было попыток регистрации');
				}
					
				const regData = results[0];

				//отправляем письмо с кодом подтверждения на указанный имейл
				return mailUtils.sendEmailConfirmLetter(regData)
					.catch(error => {
						// возможная ошибка на этапе отправки письма
						throw utils.initError(errors.INVALID_INPUT_DATA, 'Email not exists');					
					})
			})
			.then(data => {
				// создаем данные о запросе письма с повторным подтверждением
				const confirmData = {
					email: req.body.email,
					fingerprint: req.body.fingerprint,
				};

				return confirmDataModel.create(confirmData);
			})
			.then(dbResponse => {
				logUtils.fileLogDbErrors(dbResponse);

				return utils.sendResponse(res, 'Письмо с кодом подтверждения было отправлено на указанный имейл повторно');
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	.put(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

	.delete(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})
;

//----- endpoint: /api/auth/email-confirm/:uuid
// здесь завершается регистрация юзера и создаются записи о нем в БД
router.route('/email-confirm/:uuid')

	// сюда приходит запрос на подтверждение имейла по ссылке из письма
	.get(function(req, res) {
		let email;

		// ищем попытки регистрации с данным кодом подтверждения
		return Promise.resolve(regDataModel.query({emailConfirmCode: req.params.uuid}))
			.then(results => {
				if (!results.length) {
					// если нет попыток, но письмо с кодом было отправлено - значит, имейл уже подтвержден
					throw utils.initError(errors.FORBIDDEN, 'Имейл уже подтвержден');
					// редиректим на главную
					// const mainLink = `${config.server.protocol}://${config.server.host}:${config.server.port}`;
					// return res.redirect(`${mainLink}`);
				}

				// по идее должен быть один юзер на один код подтверждения
				const regData = results[0];

				const tasks = [];
				tasks.push(regData.login);

				email = regData.email;

				const userData = {
					email: regData.email,
					password: regData.password,
					resetPasswordCode: null,
					role: config.userRoles.moderator,  // сразу после регистрации роль модератор (в демонстрационных целях)  //todo!!!!!!
					inBlackList: false,
				};

				// создаем юзера
				tasks.push(userModel.create(userData));

				return Promise.all(tasks);
			})
			.spread((login, dbResponse) => {
				logUtils.fileLogDbErrors(dbResponse);

				const userId = dbResponse._doc._id;

				const tasks = [];

				const userInfoData = {
					userId: userId, 
					login: login,
				};

				// создаем личную информацию юзера
				tasks.push(userInfoModel.create(userInfoData));

				const userVisitData = {
					userId: userId,
					lastVisitData: [],
				};

				// создаем данные о последних просмотрах юзером чатов
				tasks.push(userVisitDataModel.create(userVisitData));

				return Promise.all(tasks);
			})
			.then(dbResponses => {
				logUtils.fileLogDbErrors(dbResponses);

				const tasks = [];

				tasks.push(regDataModel.query({email: email}));
				tasks.push(confirmDataModel.query({email: email}));

				return Promise.all(tasks);
			})
			.spread((regDataResults, confirmDataResults) => {
				const tasks = [];

				// удаляем все данные о попытках регистрации и запросах повторного подтверждения для данного имейла
				if (regDataResults.length) {
					regDataResults.forEach(item => {
						tasks.push(regDataModel.delete(item.id));
					})
				}
				if (confirmDataResults.length) {
					confirmDataResults.forEach(item => {
						tasks.push(confirmDataModel.delete(item.id));
					})
				}

				return Promise.all(tasks);
			})
			.then(dbResponses => {
				logUtils.fileLogDbErrors(dbResponses);

				//показываем страницу успешного подтверждения
				//TODO: ?как сделать редирект на главную через неск.секунд после показа страницы?
				const page = require('../../templates/successConfirmPage');
				res.set('Content-Type', 'text/html');
				
				return res.send(page);
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