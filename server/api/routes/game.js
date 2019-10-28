'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../lib/utils');
const tokenUtils = require('../lib/tokenUtils');
const gameUtils = require('../lib/gameUtils');
const gameModel = require('../models/game');
const Chessboard = require('../game/blocks/chessboard');

let router = express.Router();

//----- endpoint: /api/game/
router.route('/game')

	.get(function(req, res) { 
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

	// создание - начало игры (при клике на кнопку "Начать игру" на фронтэнде)
	/*data = {
		accessToken,
		userColor: < цвет фигур юзера >,
		boardSize: < размер доски >,
		level: < уровень сложности >,
		mode: < режим игры >,
	}*/
	.post(function(req, res) {
		
		return Promise.resolve(true)
			.then(() => {
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getTokenFromHeader(headerAuthorization);

				return tokenUtils.findUserByAccessToken(accessToken);
			})
			.then((user) => {
				//validate req.body
				let validationErrors = [];

				if (!req.body.userColor || req.body.userColor === '') {
					validationErrors.push('empty userColor value');
				}
				if (!req.body.boardSize || req.body.boardSize === 0) {
					validationErrors.push('empty boardSize value');
				}
				if (!req.body.level || req.body.level === '') {
					validationErrors.push('empty level value');
				}
				if (!req.body.mode || req.body.mode === '') {
					validationErrors.push('empty mode value');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError('VALIDATION_ERROR', validationErrors);
				}

				// инициализация шахматной доски - начальная расстановка актеров на доске
				//const chessboard = new Chessboard(req.body.userColor, req.body.boardSize, req.body.level, req.body.mode);
				
				const chessboard = new Chessboard(req.body);  //TODO!

				const gameData = {
					userId:  user._id,
					isFinished  :  false,
					movesCount:  0,   //??
					totalOfGame: 'standoff',   //TODO!!! rules in db

					userColor: req.body.userColor,
					boardSize: req.body.boardSize,
					level: req.body.level,
					mode: req.body.mode,
					startTime: new Date().getTime(),  //??
					gameTime: '0 ч 0 мин',
					actorsData: chessboard.actorsData,    
				};

				return gameModel.create(gameData);
			})
			.then((dbResponse) => {
				if (dbResponse.errors) {
					utils.logDbErrors(dbResponse.errors);

					// ? если в БД не удалось сохранить игру - то ошибка, надо повторить всё сначала
					throw utils.initError('INTERNAL_SERVER_ERROR', 'game error');
				}

				return utils.sendResponse(res, 'game successfully saved', 201);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})
	
	// завершение игры (при клике на кнопку "Завершить игру"/логауте во время игры)
	/*data = {
		accessToken,
		movesCount: < количество ходов >,
		totalOfGame: < результат игры - кто выиграл >,
	}*/
	.put(function(req, res) {

		return Promise.resolve(true)
			.then(() => {
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getTokenFromHeader(headerAuthorization);

				return gameUtils.findCurrentGameByToken(accessToken);
			})
			.then((game) => {
				const finishTime = new Date().getTime();
				const gameTimeNote = gameUtils.getGameTimeNote(game.startTime, finishTime);

				game.isFinished = true;
				game.movesCount = req.body.movesCount;
				game.totalOfGame = req.body.totalOfGame;
				game.actorsData = [];   //TODO??
				game.gameTime = gameTimeNote;

				return gameModel.update(game._id, game);
			})
			.then((dbResponse) => {
				if (dbResponse.errors) {
					utils.logDbErrors(dbResponse.errors);
					
					// ? если в БД не удалось сохранить игру - то ошибка, надо повторить всё сначала
					throw utils.initError('INTERNAL_SERVER_ERROR', 'game error');
				}

				return utils.sendResponse(res, 'game successfully update');
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
	})
	
	.delete(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})
;

module.exports = router;
