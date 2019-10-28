'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../lib/utils');
const tokenUtils = require('../lib/tokenUtils');

let router = express.Router();

//----- endpoint: /api/logout/
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
		accessToken: <access_token>
	}*/
	.delete(function(req, res) {
		
		return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getTokenFromHeader(headerAuthorization);
				
				//validate & decode token
				return tokenUtils.verifyAccessToken(accessToken);
			})
			.then((result) => {
				// validate result
				if (result.error || !result.payload) {
					throw utils.initError('FORBIDDEN', 'token error: invalid access token: ' + result.error.message);
				}

				return tokenUtils.deleteAllRefreshTokens(result.payload.userId);
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

