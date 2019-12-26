'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const tokenUtils = require('../../utils/tokenUtils');
const sessionUtils = require('../../utils/sessionUtils');
const errors = require('../../utils/errors');

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
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);  //todo: check if no token!
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(user => {	
				return sessionUtils.deleteAllUserSessions(user.id);
			})
			.then(result => {
				return utils.sendResponse(res, 'User is logged out', 204);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})
;

module.exports = router;

