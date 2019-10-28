'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../lib/utils');
const tokenUtils = require('../lib/tokenUtils');
const gameModel = require('../models/game');

let router = express.Router();

//----- endpoint: /api/lkUserData/
router.route('/lkUserData')

	//получение данных юзера для личного кабинета
	/*data = {
		accessToken
	}*/
	.get(function(req, res) { 

		return Promise.resolve(true)
			.then(() => {
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getTokenFromHeader(headerAuthorization);

				return tokenUtils.findUserByAccessToken(accessToken);
			})
			.then((user) => {
				let tasks = [];
				tasks.push(user);
				tasks.push(gameModel.query({userId: user._id}));

				return Promise.all(tasks);
			})
			.spread((user, games) => {
				let gameInfos = [];

				if (games.length) {
					games.forEach((game) => {						
						let gameInfo = {
							isFinished  :  game.isFinished,
							movesCount:  game.movesCount,
							totalOfGame: game.totalOfGame,
							gameTime: game.gameTime,
						};

						gameInfos.push(gameInfo);
					});
				}

				const lkData = {
					login: user.login,
					email: user.email,
					isEmailConfirmed: user.isEmailConfirmed,
					role: user.role,
					games: gameInfos,
				};

				return utils.sendResponse(res, lkData);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	.post(function(req, res) {		
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})
	
	.put(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})
	
	.delete(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})
;

module.exports = router;
