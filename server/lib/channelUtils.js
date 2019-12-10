'use strict';

const Promise = require('bluebird');
const messageUtils = require('./messageUtils');
const messageModel = require('../mongoDB/models/message');
const userInfoModel = require('../mongoDB/models/userInfo');

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
		return Promise.resolve(messageModel.query({channelId: channel.id}))
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
				channel.newMessagesCount = newMessagesCount || 0;  //?

				return channel;
			})
	};

	// сортировка чатов по дате последнего сообщения
	this.sortChannelsByLastMessageDate = function(channels) {
		const sortedChannels = channels.sort((item0, item1) => {
            const value0 = item0.lastMessage ? item0.lastMessage.getTime() : null;
            const value1 = item1.lastMessage ? item1.lastMessage.getTime() : null;

            if (value0 > value1) return 1;
            if (value0 === value1) return 0;
            if (value0 < value1) return -1;
		});
		
		return sortedChannels;
	}

	// получить название приватного чата
	this.getNameForPrivateChannel = function(privateChannel, userId) {
		const recipientId = (privateChannel.senderId === userId) ? privateChannel.recipientId : privateChannel.senderId;

		return userInfoModel.query({id: recipientId})
			.then(result => {
				privateChannel.name = (result && result.length) ? result[0].nickName : null;

				return privateChannel;
			}) 
	}

	// получить названия приватных чатов
	this.getNamesForPrivateChannels = function(privateChannels, userId) {
		const tasks = [];

		for (let i = 0; i < privateChannels.length; i++) {
			const privateChannel = privateChannels[0];
			const recipientId = (privateChannel.senderId === userId) ? privateChannel.recipientId : privateChannel.senderId;

			tasks.push(userInfoModel.query({id: recipientId}));
		}

		return Promise.all(tasks)	
			.then(userInfos => {
				if (userInfos && userInfos.length) {
					for (let i = 0; i < privateChannels.length; i++) {
						privateChannels[i].name = (userInfos[i] && userInfos[i][0]) ? userInfos[i][0].nickName : null;
					}
				}

				return privateChannels;
			}) 
	}
};

module.exports = channelUtils;