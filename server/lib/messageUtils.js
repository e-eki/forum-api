'use strict';

const Promise = require('bluebird');
const messageModel = require('../mongoDB/models/message');
const userInfoModel = require('../mongoDB/models/userInfo');

const messageUtils = new function() {

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
				const tasks = [];
				tasks.push(lastMessages);

				// ищем имя отправителя для каждого последнего сообщения
				if (lastMessages && lastMessages.length) {					
					for (let i = 0; i < lastMessages.length; i++) {
						const lastMessage = lastMessages[i];

						if (lastMessage) {
							tasks.push(userInfoModel.query({id: lastMessages[i].senderId}));
						}
						else {
							tasks.push(false);
						}
					}
				}

				return Promise.all(tasks);
			})
			.spread((lastMessages, userInfos) => {
				if (lastMessages && userInfos) {
					for (let i = 0; i < lastMessages.length; i++) {
						const lastMessage = lastMessages[i];

						if (lastMessage) {
							lastMessage.senderName = userInfos[i] ? userInfos[i].nickName : null;
						}
					}
				}

				return lastMessages;
			})
	};

	// найти кол-во новых сообщений в каждом чате
	this.getNewMessagesCountInChannels = function(channels) {
		const tasks = [];

		for (let i = 0; i < channels.length; i++) {
			const channel = channels[i];

			tasks.push(messageModel.query({
				channelId: channel.id,
				channelLastVisitDate: new Date("2019-11-26T12:46:27.235Z"),    // todo: channel.lastVisitDate,
				getNewMessagesCount: true
			}));
		}

		return Promise.all(tasks);	
	};

	// найти кол-во новых сообщений в чате
	this.getNewMessagesCountInChannel = function(channel) {

		return messageModel.query({
			channelId: channel.id,
			channelLastVisitDate: channel.lastVisitDate,
			getNewMessagesCount: true
		});		
	};
};

module.exports = messageUtils;