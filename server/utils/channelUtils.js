'use strict';

const Promise = require('bluebird');
const messageUtils = require('./messageUtils');
const messageModel = require('../mongoDB/models/message');
const userInfoModel = require('../mongoDB/models/userInfo');

// утилиты для работы с чатами
const channelUtils = new function() {

	// получить данные о сообщениях для чатов в списке, возвращает чаты
	this.getMessagesDataForChannels = function(channels, userId) {
		// получить последнее соообщение в каждом чате
		return messageUtils.getLastMessagesForChannels(channels)
			.then(lastMessages => {
				for (let i = 0; i < channels.length; i++) {
					const channel = channels[i];			
					channel.lastMessage = lastMessages ? lastMessages[i] : null;
				}

				if (userId) {
					return messageUtils.getNewMessagesCountForChannels(channels, userId);
				}
				else {
					return false;
				}
			})
			// получить кол-во новых сообщений в каждом чате
			.then(newMessagesCounts => {
				if (newMessagesCounts) {
					for (let i = 0; i < channels.length; i++) {
						const channel = channels[i];			
						channel.newMessagesCount = newMessagesCounts ? newMessagesCounts[i] : 0;
					}
				}

				return channels;
			})
	};

	// получить данные о сообщениях для текущего чата
	this.getMessagesDataForChannel = function(channel, userId) {
		// список сообщений в чате
		return Promise.resolve(messageModel.query({channelId: channel.id}))
			.then(messages => {
				return messageUtils.getSenderNamesInMessages(messages);
			})
			.then(messages => {
				channel.messages = messages;

				// закрепленное сообщение в чате
				if (channel.descriptionMessageId) {
					return messageUtils.getDescriptionMessageInChannel(channel)
				}
				else {
					return channel;
				}
			})
			.then(channel => {
				if (channel.messages.length && userId) {
					return messageUtils.getNewMessagesCountForChannel(channel, userId)
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

	// сортировка чатов по дате последнего сообщения
	this.sortChannelsByLastMessageDate = function(channels) {
		const sortedChannels = channels.sort((item0, item1) => {
            const value0 = item0.lastMessage ? item0.lastMessage.date.getTime() : null;
            const value1 = item1.lastMessage ? item1.lastMessage.date.getTime() : null;

			//todo: сделать, чтоб чаты без сообщений были ниже в списке, чем чаты с сообщениями
            if (value0 < value1) return 1;
            if (value0 === value1) return 0;
            if (value0 > value1) return -1;
		});
		
		return sortedChannels;
	}

	// получить название личного чата (логин оппонента)
	this.getNameForPrivateChannel = function(privateChannel, userId) {
		// берем логин получателя или отправителя, в зависимотси от того, чей id не равен id юзера
		const recipientId = (privateChannel.senderId.toString() === userId.toString()) ? privateChannel.recipientId : privateChannel.senderId;

		return userInfoModel.query({userId: recipientId})
			.then(result => {
				privateChannel.name = (result && result.length) ? result[0].login : null;

				return privateChannel;
			}) 
	}

	// получить названия личных чатов
	this.getNamesForPrivateChannels = function(privateChannels, userId) {
		const tasks = [];

		for (let i = 0; i < privateChannels.length; i++) {
			const privateChannel = privateChannels[i];
			const recipientId = (privateChannel.senderId.toString() === userId.toString()) ? privateChannel.recipientId : privateChannel.senderId;

			tasks.push(userInfoModel.query({userId: recipientId}));
		}

		return Promise.all(tasks)	
			.then(userInfos => {
				if (userInfos && userInfos.length) {
					for (let i = 0; i < privateChannels.length; i++) {
						privateChannels[i].name = (userInfos[i] && userInfos[i][0]) ? userInfos[i][0].login : null;
					}
				}

				return privateChannels;
			}) 
	}
};

module.exports = channelUtils;