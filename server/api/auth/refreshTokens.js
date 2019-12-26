'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const sessionUtils = require('../../utils/sessionUtils');
const sessionModel = require('../../mongoDB/models/session');
const userModel = require('../../mongoDB/models/user');
const errors = require('../../utils/errors');

let router = express.Router();

//----- endpoint: /api/auth/refresh-tokens/
router.route('/refresh-tokens/')

	.get(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

	//обновление обоих токенов
	/*data = {
		refreshToken,
		fingerprint
	}*/
	.post(function(req, res) {

		return Promise.resolve(true)
			.then(() => {
				const validationErrors = [];

				//validate req.body
				if (!req.body.refreshToken || req.body.refreshToken == '') {
					validationErrors.push('empty password');
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
			})
			.spread((session, dbResponse) => {
				utils.logDbErrors(dbResponse);

				// проверяем сессию на валидность:
				// не истекло ли время жизни, и соответствия fingerprint
				if (session.expiresIn >= new Date().getTime() ||
					session.fingerprint !== req.body.fingerprint) {
						throw utils.initError(errors.FORBIDDEN, 'invalid refresh token');
				}

				return userModel({id: session.userId});
			})
			.then(results => {
				if (!results.length) {
					throw utils.initError(errors.FORBIDDEN, 'invalid refresh token');
				}

				const user = results[0];

				return sessionUtils.addNewSessionAndGetTokensData(user, req.body.fingerprint);
			})
			.then((tokensData) => {
				utils.sendResponse(res, tokensData, 201);
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