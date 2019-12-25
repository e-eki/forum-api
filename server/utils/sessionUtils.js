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
				// у него останется только одна сессия - новая
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
				if (dbResponses.length) {   //todo: вынести 
					dbResponses.forEach(item => {
						utils.logDbErrors(dbResponse);
					})
				}

				return tokenUtils.getTokensData(user);
			})
			.spread(tokensData => {  //?then
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
				if (dbResponses && dbResponses.length) {   //todo: вынести 
					dbResponses.forEach(item => {
						utils.logDbErrors(dbResponse);
					})
				}

				return true;
			})
	}
};

module.exports = sessionUtils;