'use strict';

const express = require('express');
const Promise = require('bluebird');
const userModel = require('../models/user');
const utils = require('../lib/utils');
const mail = require('../lib/mail');

let router = express.Router();

//----- endpoint: /api/registration/
router.route('/registration')

	.get(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

	// регистрация на сайте
  	.post(function(req, res) {

		let userData;
		return Promise.resolve(true)
			.then(() => {
				//validate req.body
				let validationErrors = [];

				if (!req.body.email || req.body.email == '') {
					validationErrors.push('empty email');
				}
				if (!req.body.login || req.body.login == '') {
					validationErrors.push('empty login');
				}
				if (!req.body.password || req.body.password == '') {
					validationErrors.push('empty password');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError('VALIDATION_ERROR', validationErrors);
				}

				//check email & login duplicates
				let tasks = [];
				tasks.push(userModel.query({email: req.body.email}));
				tasks.push(userModel.query({login: req.body.login}));
				
				return Promise.all(tasks);
			})
			.spread((emailDuplicates, loginDuplicates) => {
				// если занят логин, то выбрасываем ошибку
				if (loginDuplicates.length) {
					throw utils.initError('VALIDATION_ERROR', 'login duplicate: Login exists in database');
				}

				// если занято мыло, то проверяем - подтверждено ли, если да, то выбрасываем ошибку, что оно занято
				// если нет, то выбрасываем ошибку, что оно занято - надо подтвердить
				if (emailDuplicates.length) {			
					if (emailDuplicates[0].isEmailConfirmed) {
						throw utils.initError('VALIDATION_ERROR', 'email duplicate: Email exists in database');
					}
					else {
						throw utils.initError('UNAUTHORIZED', 'email_duplicate: Email exists in database, but not confirmed');
					}
				}

				return utils.makePasswordHash(req.body.password);
			})
			.then((hash) => {
				//для каждого юзера генерится уникальный код подтверждения и записывается в БД
				// (при повторной отправке подтверждения на имейл код подтверждения берется этот же)
				const confirmEmailCode = utils.makeUId(req.body.login + req.body.email + Date.now());  

				userData = {
					login     : req.body.login,
					email     : req.body.email,
					confirmEmailCode: confirmEmailCode,
					isEmailConfirmed: false,
					password     : hash,
					resetPasswordCode: '',
					role: 'user',   //TODO??? роль юзеру
				};

				//save new user
				return userModel.create(userData);
			})
			.then((dbResponse) => {
				if (dbResponse.errors) {
					// log errors
					utils.logDbErrors(dbResponse.errors);
				};

				const data = {
					login: userData.login,
					email: userData.email,
					confirmEmailCode: userData.confirmEmailCode
				};

				//отправляем письмо с кодом подтверждения на указанный имейл
				return mail.sendConfirmEmailLetter(data)
					.catch((error) => {
						// возможная ошибка на этапе отправки письма
						throw utils.initError('INVALID_INPUT_DATA', 'Email not exists');					
					})
			})
			.then((data) => {
				//показываем страницу успешной регистрации
				//TODO: ?? как сделать редирект на главную через неск.секунд после показа страницы?
				//const page = require('../templates/successRegisterPage');
				//res.set('Content-Type', 'text/html');
				//return res.send(page);

				return utils.sendResponse(res, 'user successfully register', 201);
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
