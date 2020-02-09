'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const logUtils = require('../../utils/logUtils');
const tokenUtils = require('../../utils/tokenUtils');
const sessionUtils = require('../../utils/sessionUtils');
const errors = require('../../utils/errors');
const responses = require('../../utils/responses');
const userVisitUtils = require('../../utils/userVisitUtils');

let router = express.Router();

//----- endpoint: /api/auth/logout/
router.route('/logout')

	.get(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

  	.post(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

	.put(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

	//разлогинивание пользователя
	/*data = {
		accessToken
	}*/
	.delete(function(req, res) {
		let user;

		return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(result => {
				user = result;

				return sessionUtils.deleteAllUserSessions(user.id);
			})
			.then(dbResponses => {
				logUtils.fileLogDbErrors(dbResponses);

				// для того, чтобы в данных о последних просмотрах юзером чатов не накапливалась информация об удаленных чатах,
				// пока что они очищаются при логауте
				// todo: придумать лучшее решение
				return userVisitUtils.resetUserVisitData(user.id);
			})
			.then(dbResponses => {
				logUtils.fileLogDbErrors(dbResponses);
				
				return utils.sendResponse(res, 'User is logged out', responses.DELETED_RESPONSE.status);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})
;

module.exports = router;

