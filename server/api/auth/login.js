'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const sessionUtils = require('../../utils/sessionUtils');
const authUtils = require('../../utils/authUtils');
const errors = require('../../utils/errors');
const socialLoginDataModel = require('../../mongoDB/models/socialLoginData');
const userModel = require('../../mongoDB/models/user');

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
				// для завершения входа нужен еще fingerprint устройства юзера,
				// пока что сохраняем id юзера и отправляем клиенту id сохраненных данных
				// в ответ клиент отправляет id сохраненных данных и fingerprint - через PUT,
				// где завершается процедура входа на сайт

				// сначала удаляем уже существующие данные входа через соцсеть для данного юзера
				return socialLoginDataModel.query({userId: user.id});
			})
			.then(results => {
				const tasks = [];

				// добавляем новую запись
				tasks.push(socialLoginDataModel.create({userId: user.id}));

				// удаляем все старые
				if (results.length) {
					results.forEach(item => {
						tasks.push(socialLoginDataModel.delete({id: item.id}));
					})
				}
			})
			.spread(dbResponses => {
				utils.logDbErrors(dbResponses);

				const socialLoginDataId = dbResponses[0]._doc._id;  //?

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
		userId,
		fingerprint
	}*/
	.put(function(req, res) {
		return Promise.resolve(true)
			.then(() => {	
				const validationErrors = [];

				//validate req.body
				if (!req.body.userId || req.body.userId == '') {
					validationErrors.push('empty social login data');
				}
				if (!req.body.fingerprint || req.body.fingerprint == '') {
					validationErrors.push('empty device data');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError(errors.FORBIDDEN, validationErrors);
				}

				return socialLoginDataModel.query({userId: req.body.userId});
			})
			.then(results => {
				if (!results.length) {
					throw utils.initError(errors.FORBIDDEN);
				}

				const tasks = [];

				// удаляем все данные о входе через соцсеть для этого юзера
				results.forEach(item => {
					tasks.push(socialLoginDataModel.delete({id: item.id}));
				})

				return Promise.all(tasks);
			})
			.then(dbResponses => {
				utils.logDbErrors(dbResponses);

				return userModel.query({id: req.body.userId});
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
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
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

module.exports = router;

