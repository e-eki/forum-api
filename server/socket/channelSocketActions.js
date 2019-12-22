'use strict';

const Promise = require('bluebird');
const actionTypes = require('../actionTypes');
const channelModel = require('../mongoDB/models/channel');
const messageUtils = require('../utils/messageUtils');

// действия с использованием сокетов, связанные с чатами
const channelSocketActions = new function() {

	// обновление чата
	this.updateChannel = function(io, action) {
		if (action.channelId && action.subSectionId) {
			return Promise.resolve(channelModel.query({id: action.channelId}))
				.then(results => {
					if (results && results.length) {
						const channel = results[0];

						return messageUtils.getDescriptionMessageInChannel(channel);
					}
					else {
						return false;
					}
				})
				.then(channel => {
					io.to(action.channelId).emit('action', {
						type: actionTypes.UPDATE_CHANNEL_BY_ID,
						data: channel,
						subSectionId: action.subSectionId,
						channelId: action.channelId,
						debug: 'channel',
					});

					io.to(action.subSectionId).emit('action', {
						type: actionTypes.UPDATE_CHANNEL_BY_ID,
						data: channel,
						subSectionId: action.subSectionId,
						channelId: action.channelId,
						debug: 'subSection',
					});

					return true;
				})
		}
		else {
			return false;
		}
	};

	// удаление чата
	this.deleteChannel = function(io, action) {
		if (action.channelId && action.subSectionId) {
			io.to(action.channelId).emit('action', {
				type: actionTypes.DELETE_CHANNEL_BY_ID,
				channelId: action.channelId,
				subSectionId: action.subSectionId,
				debug: 'channel',
			});

			io.to(action.subSectionId).emit('action', {
				type: actionTypes.DELETE_CHANNEL_BY_ID,
				channelId: action.channelId,
				subSectionId: action.subSectionId,
				debug: 'subSection',
			});

			return true;
		}
		else {
			return false;
		}
	};
};

module.exports = channelSocketActions;