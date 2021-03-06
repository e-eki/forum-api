'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const logUtils = require('../../utils/logUtils');
const sessionUtils = require('../../utils/sessionUtils');
const sessionModel = require('../../mongoDB/models/session');
const userModel = require('../../mongoDB/models/user');
const errors = require('../../utils/errors');
const responses = require('../../utils/responses');

let router = express.Router();

//----- endpoint: /api/auth/refresh-tokens/
router.route('/refresh-tokens/')

	.get(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

	//обновление обоих токенов
	/*data = {
		refreshToken,
		fingerprint
	}*/
	.post(function(req, res) {

		// todo: при загрузке/перезагрузке страницы с фронтенда приходит два запроса подряд на рефреш токенов,
		// в результате чего создается две сессии вместо одной (!) - но иногда одна
		// видимо, из-за асинхронности (???)
		return Promise.resolve(true)
			.then(() => {
				const validationErrors = [];

				//validate req.body
				if (!req.body.refreshToken || req.body.refreshToken == '') {
					validationErrors.push('invalid refresh token');
				}
				if (!req.body.fingerprint || req.body.fingerprint == '') {
					validationErrors.push('empty device data');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError(errors.VALIDATION_ERROR, validationErrors);
				}

				return sessionModel.query({refreshToken: req.body.refreshToken});
			})
			.then(results => {
				if (!results.length) {
					throw utils.initError(errors.FORBIDDEN, 'invalid refresh token');
				}

				const tasks = [];
				
				const session = results[0];
				tasks.push(session);

				// удаляем сессию с этим рефреш токеном
				tasks.push(sessionModel.delete(session.id));

				return Promise.all(tasks);
			})
			.spread((session, dbResponse) => {
				logUtils.fileLogDbErrors(dbResponse);

				// проверяем сессию на валидность:
				// не истекло ли время жизни, и соответствия fingerprint
				if (session.expiresIn < new Date().getTime() ||
					session.fingerprint !== req.body.fingerprint) {
						throw utils.initError(errors.FORBIDDEN, 'invalid refresh token');
				}

				return userModel.query({id: session.userId});
			})
			.then(results => {
				if (!results.length) {
					throw utils.initError(errors.FORBIDDEN, 'invalid refresh token');
				}

				const user = results[0];

				return sessionUtils.addNewSessionAndGetTokensData(user, req.body.fingerprint);
			})
			.then((tokensData) => {
				delete tokensData.refreshTokenExpiresIn; //?
				
				utils.sendResponse(res, tokensData, responses.CREATED_RESPONSE.status);
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

module.exports = router;