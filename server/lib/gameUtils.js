'use strict';

const Promise = require('bluebird');
const tokenUtils = require('../lib/tokenUtils');
const gameModel = require('../models/game');

const gameUtils = new function() {

    this.getGameTimeNote = function(startTime, finishTime) {  //todo: check
        const gameTime = finishTime - startTime;

		const minute = 1000 * 60;
		const hour = minute * 60;
		const gameHours = Math.round(gameTime / hour);
		const gameMinutes = Math.round((gameTime - gameHours * hour) / minute);

		return (`${gameHours} ч ${gameMinutes} мин`);
	};
	
	this.findCurrentGameByToken = function(accessToken) {
		return Promise.resolve(true)
			.then(() => {
				return tokenUtils.findUserByAccessToken(accessToken);
			})
			.then((user) => {
				let tasks = [];
				tasks.push(user);
				// get game
				tasks.push(gameModel.findUserUnfinishedGames(user._id));

				return Promise.all(tasks);
			})
			.spread((user, games) => {
				if (!games.length) {
					throw utils.initError('NOT_FOUND', 'game error: no unfinished games for this user');  //??
				}

				//по идее должна быть только одна (или ни одной) незаконченная игра для каждого юзера
				const game = games[0];
				return game;
			})
	};

};

module.exports = gameUtils;