'use strict';

const Promise = require('bluebird');
const actionTypes = require('../actionTypes');
const messageModel = require('../mongoDB/models/message');
const channelModel = require('../mongoDB/models/channel');
const messageUtils = require('../utils/messageUtils');

// отправление по сокетам действий, связанных с сообщениями
const messageSocketActions = new function() {

	// обновление сообщения
	this.updateMessage = function(io, action) {
		if (action.messageId && action.channelId) {
			return messageModel.query({id: action.messageId})
				.then(messages => {
					if (messages.length) {
						return messageUtils.getSenderNamesInMessages(messages);
					}
					else {
						return false;
					}
				})
				.then(messages => {
					if (!messages || !messages.length) {
						return false;
					}
					else {
						const message = messages[0];

						// io.to(action.messageId).emit('action', {  //??
						// 	type: actionTypes.UPDATE_MESSAGE_BY_ID,
						// 	data: message,
						// 	messageId: action.messageId,
						// 	debug: 'message',
						// });

						io.to(action.channelId).emit('action', {
							type: actionTypes.UPDATE_MESSAGE_BY_ID,
							data: message,
							messageId: action.messageId,
							channelId: action.channelId,
							debug: 'channel',
						});

						// если это личное сообщение, то о нем должен узнать получатель
						if (action.recipientId) {
							io.to(action.recipientId).emit('action', {
								type: actionTypes.UPDATE_MESSAGE_BY_ID,
								data: message,
								messageId: action.messageId,
								channelId: action.channelId,
								recipientId: message.recipientId,
								debug: 'recipientId',
							});

							return true;
						}
						// если это сообщение на форуме, то о нем должны узнать все, кто в соотв.подразделе
						else 
							return channelModel.query({id: action.channelId})
								.then(results => {
									if (results && results.length) {
										const channel = results[0];

										io.to(channel.subSectionId).emit('action', {
											type: actionTypes.UPDATE_MESSAGE_BY_ID,
											data: message,
											messageId: action.messageId,
											channelId: action.channelId,
											debug: 'subSection',
										});
									}

									return true;
							})
					}
				})
		}
		else {
			return false;
		}
	};

	// удаление сообщения
	this.deleteMessage = function(io, action) {
		if (action.messageId && action.channelId) {
			// io.to(action.messageId).emit('action', {
			// 	type: actionTypes.DELETE_MESSAGE_BY_ID,
			// 	messageId: action.messageId,
			// 	debug: 'message',
			// });

			io.to(action.channelId).emit('action', {
				type: actionTypes.DELETE_MESSAGE_BY_ID,
				messageId: action.messageId,
				channelId: action.channelId,
				debug: 'channel',
			});

			return true;
		}
		else {
			return false;
		}
	};
};

module.exports = messageSocketActions;