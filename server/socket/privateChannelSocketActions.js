'use strict';

const Promise = require('bluebird');
const actionTypes = require('../actionTypes');
const privateChannelModel = require('../mongoDB/models/privateChannel');
const messageUtils = require('../utils/messageUtils');

// действия с использованием сокетов, связанные с приватными чатами
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
					io.to(action.privateChannelId).emit('action', {
						type: actionTypes.UPDATE_PRIVATE_CHANNEL_BY_ID,
						data: privateChannel,
						privateChannelId: action.privateChannelId,
						debug: 'privateChannel',
					});

					if (action.senderId) {
						io.to(action.senderId).emit('action', {
							type: actionTypes.UPDATE_PRIVATE_CHANNEL_BY_ID,
							data: privateChannel,
							privateChannelId: action.privateChannelId,
							debug: 'senderId',
						});
					}

					if (action.recipientId) {
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
			io.to(action.privateChannelId).emit('action', {
				type: actionTypes.DELETE_PRIVATE_CHANNEL_BY_ID,
				privateChannelId: action.privateChannelId,
				debug: 'privateChannel',
			});

			if (action.senderId) {
				io.to(action.senderId).emit('action', {
					type: actionTypes.DELETE_PRIVATE_CHANNEL_BY_ID,
					privateChannelId: action.privateChannelId,
					debug: 'senderId',
				});
			}

			if (action.recipientId) {
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