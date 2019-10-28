'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../lib/utils');
const tokenUtils = require('../lib/tokenUtils');
const gameUtils = require('../lib/gameUtils');
const gameModel = require('../models/game');
const Chessboard = require('../game/blocks/chessboard');

let router = express.Router();

//----- endpoint: /api/gameTurn/
router.route('/gameturn')

	// запрос хода ИИ
	.get(function(req, res) { 

		return Promise.resolve(true)
			.then(() => {
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getTokenFromHeader(headerAuthorization);

				return gameUtils.findCurrentGameByToken(accessToken);
			})
			.then((game) => {
				// инициализация шахматной доски - расстановка актеров на доске
				//const chessboard = new Chessboard(game.boardSize, game.mode, game.actorsData);
				const chessboard = new Chessboard(game, game.actorsData);

				const AIturn = chessboard.getAIturn();
				delete AIturn.actor;
				delete AIturn.type;
				delete AIturn.priority;

				chessboard.set(AIturn);  //TODO

				const newActorsData = chessboard.fillActorsDataByActors(chessboard.actors);
				game.actorsData = newActorsData;

				//??
				game.movesCount++;
				const currentTime = new Date().getTime();
				const gameTimeNote = gameUtils.getGameTimeNote(game.startTime, currentTime);
				game.gameTime = gameTimeNote;

				let tasks = [];

				tasks.push(AIturn);
				tasks.push(gameModel.update(game._id, game));

				return Promise.all(tasks);
			})
			.spread((AIturn, dbResponse) => {

				if (dbResponse.errors) {
					utils.logDbErrors(dbResponse.errors);
					throw utils.initError('INTERNAL_SERVER_ERROR', 'game error');
				}

				return utils.sendResponse(res, AIturn, 201);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})

	// запрос, что был сделан ход с данными хода юзера
	/*data = {
		accessToken,
		userTurn: {
			currentPosition, 
			targetPosition,
		},
	}*/
	.put(function(req, res) {
		
		return Promise.resolve(true)
			.then(() => {
				if (!req.body.userTurn) {
					throw utils.initError('VALIDATION_ERROR', 'incorrect game turn data: empty user turn data');
				}

				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getTokenFromHeader(headerAuthorization);

				return gameUtils.findCurrentGameByToken(accessToken);
			})
			.then((game) => {
				// инициализация шахматной доски - расстановка актеров на доске
				//const chessboard = new Chessboard(game.boardSize, game.mode, game.actorsData);
				const chessboard = new Chessboard(game, game.actorsData);

				chessboard.setTurn(req.body.userTurn);

				const newActorsData = chessboard.fillActorsDataByActors(chessboard.actors);
				game.actorsData = newActorsData;
				//??
				game.movesCount++;
				const currentTime = new Date().getTime();
				const gameTimeNote = gameUtils.getGameTimeNote(game.startTime, currentTime);
				game.gameTime = gameTimeNote;

				return gameModel.update(game._id, game);
			})
			.then((dbResponse) => {
				if (dbResponse.errors) {
					utils.logDbErrors(dbResponse.errors);
					throw utils.initError('INTERNAL_SERVER_ERROR', 'game error');
				}

				return utils.sendResponse(res, 'user turn set', 201);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})
	
	.post(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})
	
	.delete(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})
;

module.exports = router;
