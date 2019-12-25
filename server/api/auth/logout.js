'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const tokenUtils = require('../../utils/tokenUtils');
const sessionUtils = require('../../utils/sessionUtils');

let router = express.Router();

//----- endpoint: /api/auth/logout/
router.route('/logout')

	.get(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

  	.post(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

	.put(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

	//разлогинивание пользователя
	/*data = {
		accessToken
	}*/
	.delete(function(req, res) {	
		return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				//validate token
				return tokenUtils.isAccessTokenValid(accessToken);  //todo: get userId
			})
			.spread(isValid => {  //?then
				const tasks = [];

				if (isValid) {
					tasks.push(sessionUtils.deleteAllUserSessions())
				}
			})
			.then((data) => {
				return utils.sendResponse(res, 'User is logged out', 204);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})
;

module.exports = router;

