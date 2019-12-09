'use strict';

const Promise = require('bluebird');
const messageUtils = require('./messageUtils');
const messageModel = require('../mongoDB/models/message');

const channelUtils = new function() {

	// получить данные о сообщениях для чатов в списке
	this.getMessagesDataForChannels = function(channels) {

		// получить последнее соообщение в каждом чате
		return messageUtils.getLastMessageInChannels(channels)
			.then(lastMessages => {
				for (let i = 0; i < channels.length; i++) {
					const channel = channels[i];			
					channel.lastMessage = lastMessages ? lastMessages[i] : null;
				}

				return messageUtils.getNewMessagesCountInChannels(channels);
			})
			// получить кол-во новых сообщений в каждом чате
			.then((newMessagesCounts) => {
				for (let i = 0; i < channels.length; i++) {
					const channel = channels[i];			
					channel.newMessagesCount = newMessagesCounts ? newMessagesCounts[i] : null;
				}

				return channels;
			})
	};

	// получить данные о сообщениях для текущего чата
	this.getMessagesDataForChannel = function(channel) {

		// сообщения в чате
		return messageModel.query({channelId: channel.id})
			.then(messages => {
				channel.messages = messages || [];

				if (channel.messages.length) {
					return messageUtils.getNewMessagesCountInChannel(channel)
				}
				else {
					return false;
				}
			})
			// кол-во новых сообщений
			.then(newMessagesCount => {
				channel.newMessagesCount = newMessagesCount || 0;

				return channel;
			})

	};
};

module.exports = channelUtils;