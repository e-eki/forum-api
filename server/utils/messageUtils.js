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
			.spread(userInfos => {
				if (messages && userInfos) {
					for (let i = 0; i < messages.length; i++) {
						const message = messages[i];

						if (message) {
							message.senderName = userInfos[i] ? userInfos[i].login : null;
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
			.spread(lastMessages => {
				return this.getSenderNamesInMessages(lastMessages);
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

						const lastVisitChannel = userVisitData.lastVisitData.find(item => new ObjectId(item.channelId) === new ObjectId(channel.id));  //?
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

					const lastVisitChannel = userVisitData.lastVisitData.find(item => new ObjectId(item.channelId) === new ObjectId(channel.id));  //?
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