'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const sessionUtils = require('../../utils/sessionUtils');
const authUtils = require('../../utils/authUtils');
const errors = require('../../utils/errors');
const socialLoginDataModel = require('../../mongoDB/models/socialLoginData');
const userModel = require('../../mongoDB/models/user');
const config = require('../../config');

let router = express.Router();

//----- endpoint: /api/auth/login/
router.route('/login')

	// вход через vkontakte/facebook/google
	/*data = {
		service: <vk | fb | g>,
		code,
	}*/
	.get(function(req, res) {
		return Promise.resolve(true)
			.then(() => {	
				const validationErrors = [];

				//validate req.query
				// (code & state sends by vk as GET-parameter)
				// (code & scope sends by google as GET-parameter)
				if ((!req.query.state || req.query.state == '') && (!req.query.scope || req.query.scope == '')) {
					validationErrors.push('incorrect social login data: empty service name');
				}
				if (!req.query.code || req.query.code == '') {
					validationErrors.push('incorrect social login data: empty code');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError(errors.VALIDATION_ERROR, validationErrors);
				}

				const service = req.query.state ? req.query.state : 'google';

				const data = {
					code: req.query.code,	
				};

				return getUser(service, data);
			})
			.then(user => {
				const tasks = [];
				tasks.push(user);

				// для завершения входа нужен еще fingerprint устройства юзера,
				// пока что сохраняем id юзера и отправляем клиенту id сохраненных данных
				// в ответ клиент отправляет id сохраненных данных и fingerprint - через PUT,
				// где завершается процедура входа на сайт

				tasks.push(socialLoginDataModel.query({userId: user.id}));

				return Promise.all(tasks);
			})
			.spread((user, results) => {
				if (results.length && (results.length >= config.security.socialLoginAttemptsMaxCount)) {
					throw utils.initError(errors.VALIDATION_ERROR, 'Количество запросов на вход через соцсеть больше допустимого. Заходите через сайт. Или обратитесь к администратору сайта.');
				}

				const socialLoginData = {
					userId: user.id.toString()
				};

				// добавляем новую запись
				return socialLoginDataModel.create(socialLoginData);
			})
			.then(dbResponse => {
				utils.logDbErrors(dbResponse);

				const socialLoginDataId = dbResponse._doc._id;

				return utils.sendResponse(res, socialLoginDataId);   //!!
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	//вход через сайт
	/*data = {
		email,
		password,
		fingerprint 
	}*/
  	.post(function(req, res) {
		return Promise.resolve(true)
			.then(() => {	
				const validationErrors = [];

				//validate req.body
				if (!req.body.email || req.body.email == '') {
					validationErrors.push('empty email');
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

				const data = {
					email: req.body.email,
					password: req.body.password
				};

				return getUser('site', data);
			})
			.then(user => {
				const tasks = [];
				tasks.push(user);

				// удаляем все данные о входе через соцсеть для этого юзера
				tasks.push(deleteUserSocialLoginData(user.id));

				return Promise.all(tasks);
			})
			.spread((user, result) => {
				return sessionUtils.addNewSessionAndGetTokensData(user, req.body.fingerprint);
			})
			.then(tokensData => {
				return utils.sendResponse(res, tokensData, 201);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	// данные с сайта для завершения входа через соцсеть
	/*data = {
		socialLoginDataId,
		fingerprint
	}*/
	.put(function(req, res) {
		return Promise.resolve(true)
			.then(() => {	
				const validationErrors = [];

				//validate req.body
				if (!req.body.socialLoginDataId || req.body.socialLoginDataId == '') {
					validationErrors.push('empty social login data');
				}
				if (!req.body.fingerprint || req.body.fingerprint == '') {
					validationErrors.push('empty device data');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError(errors.FORBIDDEN, validationErrors);
				}

				return socialLoginDataModel.query({id: req.body.socialLoginDataId});
			})
			.then(results => {
				if (!results.length) {
					throw utils.initError(errors.FORBIDDEN);
				}

				const socialLoginData = results[0];

				const tasks = [];
				tasks.push(socialLoginData.userId);

				// удаляем все данные о входе через соцсеть для этого юзера
				tasks.push(deleteUserSocialLoginData(socialLoginData.userId.toString()));

				return Promise.all(tasks);
			})
			.spread((userId, result) => {
				return userModel.query({id: userId});
			})
			.then(results => {
				if (!results.length) {
					throw utils.initError(errors.FORBIDDEN);
				}

				const user = results[0];

				return sessionUtils.addNewSessionAndGetTokensData(user, req.body.fingerprint);
			})
			.then(tokensData => {
				return utils.sendResponse(res, tokensData, 201);  
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	.delete(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})
;

// приватный метод для инкапсуляции процедуры входа через сайт/vk/fb, т.к. vk присылает в GET,
// а для входа через сайт нужен POST (т.к. приходят данные в теле запроса)

	/*
	* service = {
	*		site | vk | fb	
	* },
    * data = {
    *       email, password   
    *       или
    *       code
    * }
    */

   const getUser = function(service, data) {  //?let
		return Promise.resolve(true)
			.then(() => {
				let task;

				//TODO: fb
				switch (service) {
					case 'site':
						task = authUtils.getUserBySiteAuth(data.email, data.password);
						break;
					case 'vk':
						task = authUtils.getUserByVkAuth(data.code);
						break;
					case 'google':
						task = authUtils.getUserByGoogleAuth(data.code);
						break;
					default:
						throw utils.initError(errors.INTERNAL_SERVER_ERROR);
				}

				return task;
			})
	};

	// удалить все данные о входе через соцсеть для этого юзера
	const deleteUserSocialLoginData = function(userId) {
		return socialLoginDataModel.query({userId: userId})
			.then(results => {
				const tasks = [];

				if (results.length) {
					results.forEach(item => {
						tasks.push(socialLoginDataModel.delete(item.id));
					})
				}
				else {
					tasks.push(false);
				}

				return Promise.all(tasks);
			})
			.then(dbResponses => {
				utils.logDbErrors(dbResponses);

				return true;
			})
	}

module.exports = router;

