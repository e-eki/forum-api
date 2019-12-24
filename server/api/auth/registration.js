'use strict';

const express = require('express');
const Promise = require('bluebird');
const uuidV4 = require('uuidv4');
const regDataModel = require('../../mongoDB/models/registrationData');
const utils = require('../../utils/baseUtils');
const mailUtils = require('../../utils/mailUtils');
const errors = require('../../utils/errors');
const config = require('../../config');

let router = express.Router();

//----- endpoint: /api/auth/registration/
router.route('/registration')

	.get(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

	// регистрация на сайте
	/* data = {
		email,
		login,
		password,
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
				if (!req.body.login || req.body.login == '') {
					validationErrors.push('empty login');
				}
				if (!req.body.password || req.body.password == '') {
					validationErrors.push('empty password');
				}
				if (!req.body.fingerprint || req.body.fingerprint == '') {
					validationErrors.push('empty device data');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError(errors.VALIDATION_ERROR, validationErrors);
				}

				// проверяем количество уже сделанных попыток зарегистрироваться с этого устройства,
				// если их количество = макс.допустимому, то все последующие не обрабатывать
				return regDataModel.query({fingerprint: req.body.fingerprint, getCount: true});
			})
			.then(regDataModelsCount => {
				if (regDataModelsCount >= config.security.regAttempsMaxCount) {
					throw utils.initError(errors.VALIDATION_ERROR, 'Количество попыток зарегистрироваться с данного устройства больше допустимого. Обратитесь к администратору сайта.');
				}

				//check email & login duplicates
				let tasks = [];
				tasks.push(userModel.query({email: req.body.email}));
				tasks.push(userModel.query({login: req.body.login}));
				
				return Promise.all(tasks);
			})
			.spread((emailDuplicates, loginDuplicates) => {
				const validationErrors = [];

				// если занят логин или имейл, то выбрасываем ошибку
				if (emailDuplicates.length) {
					validationErrors.push('Пользователь с указанным имейлом уже существует');
				}
				if (loginDuplicates.length) {
					validationErrors.push('Пользователь с указанным логином уже существует');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError(errors.VALIDATION_ERROR, validationErrors);
				}

				// вычисляем хэш пароля
				return utils.makePasswordHash(req.body.password);
			})
			.then((hash) => {
				//для каждого юзера генерится уникальный код подтверждения имейла
				// (при повторной отправке подтверждения на имейл код подтверждения берется этот же)
				const emailConfirmCode = uuidV4.fromString(req.body.login + req.body.email + Date.now());   //? 

				const regData = {
					login: req.body.login,
					email: req.body.email,
					password: hash,
					emailConfirmCode: emailConfirmCode,
					fingerprint: req.body.fingerprint,
				};

				const tasks = [];
				tasks.push(regData);

				//save new regData
				tasks.push(regDataModel.create(regData));

				return Promise.all(tasks);
			})
			.spread((regData, dbResponse) => {
				// log errors
				utils.logDbErrors(dbResponse);

				//отправляем письмо с кодом подтверждения на указанный имейл
				return mailUtils.sendEmailConfirmLetter(regData)
					.catch((error) => {
						// возможная ошибка на этапе отправки письма
						throw utils.initError(errors.INVALID_INPUT_DATA, 'Email not exists');					
					})
			})
			.then((data) => {
				//показываем страницу успешной регистрации
				//TODO: ?? как сделать редирект на главную через неск.секунд после показа страницы?
				//const page = require('../templates/successRegisterPage');
				//res.set('Content-Type', 'text/html');
				//return res.send(page);

				return utils.sendResponse(res, 'Письмо с кодом подтверждения было отправлено на указанный имейл', 201);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	.put(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

	.delete(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})
;

module.exports = router;
