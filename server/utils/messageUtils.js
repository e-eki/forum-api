'use strict';

const Promise = require('bluebird');
const messageModel = require('../mongoDB/models/message');
const userInfoModel = require('../mongoDB/models/userInfo');

const messageUtils = new function() {

	// найти имена отправителей для сообщений
	//todo: локализовать и как-то сделать обязательным, тк всегда для сообщений нужно имя отправителя
	this.getSenderNamesInMessages = function(messages) {
		const tasks = [];

		if (messages && messages.length) {					
			for (let i = 0; i < messages.length; i++) {
				const message = messages[i];

				if (message) {
					tasks.push(userInfoModel.query({id: message.senderId}));
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
							message.senderName = userInfos[i] ? userInfos[i].nickName : null;
						}
					}
				}

				return (messages || []);
			})
	};

	// найти последнее сообщение в каждом чате
	this.getLastMessageInChannels = function(channels) {
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

	// найти кол-во новых сообщений в каждом чате
	this.getNewMessagesCountInChannels = function(channels) {
		const tasks = [];

		for (let i = 0; i < channels.length; i++) {
			const channel = channels[i];

			tasks.push(messageModel.query({
				channelId: channel.id,
				channelLastVisitDate: channel.lastVisitDate,   //new Date("2019-11-26T12:46:27.235Z"),
				getNewMessagesCount: true
			}));
		}

		return Promise.all(tasks);	
	};

	// найти кол-во новых сообщений в чате
	this.getNewMessagesCountInChannel = function(channel) {

		return messageModel.query({
			channelId: channel.id,
			channelLastVisitDate: channel.lastVisitDate,   //new Date("2019-11-26T12:46:27.235Z"),
			getNewMessagesCount: true
		});		
	};

	// найти закрепленное сообщение в чате
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