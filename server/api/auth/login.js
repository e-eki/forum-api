'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../lib/utils');
const tokenUtils = require('../lib/tokenUtils');
const authUtils = require('../lib/authUtils');

let router = express.Router();

//----- endpoint: /api/login/
router.route('/login')

	// вход через vkontakte/facebook/google
	/*data = {
		service: <vk | fb | g>, code: <code>
	}*/
	.get(function(req, res) {

		return Promise.resolve(true)
			.then(() => {	
				let validationErrors = [];

				//validate req.query
				// (code & state sends by vk as GET-parameter)
				// (code & scope sends by google as GET-parameter)
				if ((!req.query.state || req.query.state == '') && (!req.query.scope || req.query.scope == '')) {
					validationErrors.push('incorrect social login data: empty service name');
				}
				else if (!req.query.code || req.query.code == '') {
					validationErrors.push('incorrect social login data: empty code');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError('FORBIDDEN', validationErrors);
				}

				const service = req.query.state ? req.query.state : 'google';
				//const redirectUri = config.server.host + ':' + config.server.host + '/api' + req.route.path;  //???

				const data = {
					code: req.query.code,	
				};

				return loginAction(service, data);
			})
			.then((tokensData) => {
				return utils.sendResponse(res, tokensData);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	//вход через сайт
	/*data = {
		email: <email>, password: <password> 
	}*/
  	.post(function(req, res) {

		return Promise.resolve(true)
			.then(() => {	
				let validationErrors = [];			
				//validate req.body
				if (!req.body.email || req.body.email == '') {
					validationErrors.push('empty email');
				}
				else if (!req.body.password || req.body.password == '') {
					validationErrors.push('empty password');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError('VALIDATION_ERROR', validationErrors);
				}

				const data = {
					email: req.body.email,
					password: req.body.password
				};

				return loginAction('site', data);
			})
			.then((tokensData) => {
				return utils.sendResponse(res, tokensData);  
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

// приватный метод для инкапсуляции процедуры входа через сайт/vk/fb, т.к. vk присылает в GET,
// а для входа через сайт нужен POST (т.к. приходят данные в теле запроса)

	/*
	* service = {
	*		site | vk | fb	
	* },
    * data = {
    *       email: <email>, password: <password>    
    *       или
    *       code: <code>
    * }
    */

let loginAction = function(service, data) {

	return Promise.resolve(true)
		.then(() => {
			let _promise;

			//TODO: fb
			switch (service) {
				case 'site':
					_promise = authUtils.getUserBySiteAuth(data.email, data.password);
					break;
				case 'vk':
					_promise = authUtils.getUserByVkAuth(data.code);
					break;
				case 'google':
					_promise = authUtils.getUserByGoogleAuth(data.code);
					break;
				default:
					throw utils.initError('INTERNAL_SERVER_ERROR');
			}

			return _promise;
		})
		.then((user) => {
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
};

module.exports = router;

