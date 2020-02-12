'use strict';

const Promise = require('bluebird');
const ObjectId = require('mongoose').Types.ObjectId;
const messageModel = require('../mongoDB/models/message');
const userInfoModel = require('../mongoDB/models/userInfo');
const userVisitDataModel = require('../mongoDB/models/userVisitData');

const messageUtils = new function() {

	// найти имена отправителей для сообщений, возвращает сообщения с именами
	//todo: как-то сделать обязательным, тк всегда для сообщений нужно имя отправителя
	this.getSenderNamesInMessages = function(messages) {
		const tasks = [];

		if (messages && messages.length) {					
			for (let i = 0; i < messages.length; i++) {
				const message = messages[i];

				if (message) {
					tasks.push(userInfoModel.query({userId: message.senderId}));
				}
				else {
					tasks.push(false);
				}
			}
		}

		return Promise.all(tasks)
			.then(userInfos => {
				if (messages && userInfos) {
					for (let i = 0; i < messages.length; i++) {
						const userInfo = userInfos[i] ? userInfos[i][0] : null;

						if (userInfo) {
							const message = messages[i];

							if (message) {
								message.senderName = userInfo.login;
							}
						}
					}
				}

				return (messages || []);
			})
	};

	// найти последнее сообщение в каждом чате, возвращает массив сообщений
	this.getLastMessagesForChannels = function(channels) {
		const tasks = [];

		for (let i = 0; i < channels.length; i++) {
			tasks.push(messageModel.query({
				channelId: channels[i].id,
				getLastMessage: true
			}));
		}

		return Promise.all(tasks)
			.then(results => {
				const messages = [];

				for (let i = 0; i < channels.length; i++) {
					if (results[i] && results[i].length) {
						const message = results[i][0];

						messages.push(message);
					}
				}

				return this.getSenderNamesInMessages(messages);
			});
	};

	// найти кол-во новых сообщений в каждом чате, возвращает массив кол-в
	this.getNewMessagesCountForChannels = function(channels, userId) {
		return userVisitDataModel.query({userId: userId})
			.then(results => {
				const tasks = [];

				if (results.length) {
					const userVisitData = results[0];

					for (let i = 0; i < channels.length; i++) {
						const channel = channels[i];

						const lastVisitChannel = userVisitData.lastVisitData.find(item => item.channelId.toString() === channel.id.toString());
						const lastVisitDate = lastVisitChannel ? lastVisitChannel.date : null;

						tasks.push(messageModel.query({
							channelId: channel.id,
							channelLastVisitDate: lastVisitDate,
							getCount: true
						}));
					}	
				}

				return Promise.all(tasks);
			})
	};

	// найти кол-во новых сообщений в чате, возвращает кол-во
	this.getNewMessagesCountForChannel = function(channel, userId) {
		return userVisitDataModel.query({userId: userId})
			.then(results => {
				if (results.length) {
					const userVisitData = results[0];

					const lastVisitChannel = userVisitData.lastVisitData.find(item => item.channelId.toString() === channel.id.toString());
					const lastVisitDate = lastVisitChannel ? lastVisitChannel.date : null;

					return messageModel.query({
						channelId: channel.id,
						channelLastVisitDate: lastVisitDate,
						getCount: true
					});
				}
				else {
					return false;
				}
			})
	};

	// найти закрепленное сообщение в чате, возвращает чат
	this.getDescriptionMessageInChannel = function(channel) {
		const tasks = [];

		if (channel.descriptionMessageId) {
			tasks.push(messageModel.query({id: channel.descriptionMessageId}));
		}
		else {
			tasks.push(false);
		}
		
		return Promise.all(tasks)
			.spread(results => {
				if (results && results.length) {
					return messageUtils.getSenderNamesInMessages(results);
				}
				else {
					return results;
				}
			})
			.then(results => {
				channel.descriptionMessage = (results && results.length) ? results[0] : null;
				//delete channel.descriptionMessageId;  //?

				return channel;
			})
	}
};

module.exports = messageUtils;