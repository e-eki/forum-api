'use strict';

const Promise = require('bluebird');
const config = require('../config');
const utils = require('./baseUtils');
const tokenUtils = require('./tokenUtils');
const sessionModel = require('../mongoDB/models/session');

const sessionUtils = new function() {

	// создать новую сессию и вернуть токены
	this.addNewSessionAndGetTokensData = function(user, fingerprint) {
		return Promise.resolve(sessionModel.query({userId: user.id}))
			.then(results => {
				const tasks = [];

				// если количество сессий у юзера больше допустимого, то все удаляем
				// и у него останется только одна сессия - новая
				if (results.length >= config.security.userSessionsMaxCount) {
					results.forEach(item => {
						tasks.push(sessionModel.delete(item.id));
					})
				}
				else {
					tasks.push(false);
				}

				return Promise.all(tasks);
			})
			.then(dbResponses => {
				utils.logDbErrors(dbResponses);

				return tokenUtils.getTokensData(user);
			})
			.then(tokensData => {
				const tasks = [];

				tasks.push(tokensData);

				// сохраняем новую сессию
				const session = {
					userId: user.id,
					fingerprint: fingerprint,
					refreshToken: tokensData.refreshToken,
					expiresIn: tokensData.expiresIn,
				};

				tasks.push(sessionModel.create(session));

				return Promise.all(tasks);
			})
			.spread((tokensData, dbResponse) => {
				utils.logDbErrors(dbResponse);

				delete tokensData.expiresIn;  //?
				return tokensData;
			})
	};

	// удалить все сессии юзера
	this.deleteAllUserSessions = function(userId) {
		return Promise.resolve(sessionModel.query({userId: userId}))
			.then(results => {
				const tasks = [];

				if (results.length) {
					results.forEach(item => {
						tasks.push(sessionModel.delete(item.id));
					})
				}
				else {
					tasks.push(false);
				}

				return Promise.all(tasks);
			})
			.then(dbResponses => {
				utils.logDbErrors(dbResponses);

				return true;
			})
	}
};

module.exports = sessionUtils;