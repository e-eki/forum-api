'use strict';

const Promise = require('bluebird');
const actionTypes = require('../actionTypes');
const privateChannelModel = require('../mongoDB/models/privateChannel');
const messageUtils = require('../utils/messageUtils');

// отправление по сокетам действий, связанных с приватными чатами
const privateChannelSocketActions = new function() {

	// обновление приватного чата
	this.updatePrivateChannel = function(io, action) {
		if (action.privateChannelId) {
			return privateChannelModel.query({id: action.privateChannelId})
				.then(results => {
					if (results && results.length) {
						const privateChannel = results[0];

						return messageUtils.getDescriptionMessageInChannel(privateChannel);
					}
					else {
						return false;
					}
				})
				.then(privateChannel => {
					// отправляется тем, кто на странице данного личного чата (?)
					io.to(action.privateChannelId).emit('action', {
						type: actionTypes.UPDATE_PRIVATE_CHANNEL_BY_ID,
						data: privateChannel,
						privateChannelId: action.privateChannelId,
						debug: 'privateChannel',
					});

					if (action.senderId) {
						// и юзеру, который создал/обновил чат
						io.to(action.senderId).emit('action', {
							type: actionTypes.UPDATE_PRIVATE_CHANNEL_BY_ID,
							data: privateChannel,
							privateChannelId: action.privateChannelId,
							debug: 'senderId',
						});
					}

					if (action.recipientId) {
						// и юзеру, с которым чат
						io.to(action.recipientId).emit('action', {
							type: actionTypes.UPDATE_PRIVATE_CHANNEL_BY_ID,
							data: privateChannel,
							privateChannelId: action.privateChannelId,
							debug: 'recipientId',
						});
					}

					return true;
				})
		}
		else {
			return false;
		}
	};

	// удаление приватного чата
	this.deletePrivateChannel = function(io, action) {
		if (action.privateChannelId) {
			// отправляется тем, кто на странице данного личного чата (?)
			io.to(action.privateChannelId).emit('action', {
				type: actionTypes.DELETE_PRIVATE_CHANNEL_BY_ID,
				privateChannelId: action.privateChannelId,
				debug: 'privateChannel',
			});

			if (action.senderId) {
				// и юзеру, который удалил чат
				io.to(action.senderId).emit('action', {
					type: actionTypes.DELETE_PRIVATE_CHANNEL_BY_ID,
					privateChannelId: action.privateChannelId,
					debug: 'senderId',
				});
			}

			if (action.recipientId) {
				// и юзеру, с которым был чат
				io.to(action.recipientId).emit('action', {
					type: actionTypes.DELETE_PRIVATE_CHANNEL_BY_ID,
					privateChannelId: action.privateChannelId,
					debug: 'recipientId',
				});
			}

			return true;
		}
		else {
			return false;
		}
	};
};

module.exports = privateChannelSocketActions;