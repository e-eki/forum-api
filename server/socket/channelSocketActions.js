'use strict';

const Promise = require('bluebird');
const actionTypes = require('../actionTypes');
const channelModel = require('../mongoDB/models/channel');
const messageUtils = require('../utils/messageUtils');
const userVisitDataModel = require('../mongoDB/models/userVisitData');

// отправление по сокетам действий, связанных с чатами
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

	// обновление данных о последнем просмотре юзером чата
	this.updateLastVisitChannel = function(action) {
		if (!action.userId) {
			return false;
		}
		else {
			return userVisitDataModel.query({userId: action.userId})
				.then(results => {
					if (results && results.length) {
						const userVisitData = results[0];

						const newLastVisitChannel = {
							channelId: action.roomId,
							date: new Date(),
						};

						if (userVisitData.lastVisitData.length) {
							const lastVisitChannel = userVisitData.lastVisitData.find(item => item.channelId === action.roomId);

							if (lastVisitChannel) {
								lastVisitChannel.date = new Date();
							}
							else {
								userVisitData.lastVisitData.push(newLastVisitChannel);
							}
						}
						else {
							userVisitData.lastVisitData.push(newLastVisitChannel);
						}

						return userVisitDataModel.update(userVisitData.id, userVisitData);  //?
					}
					else {
						return true;
					}
				})
			}
	}
};

module.exports = channelSocketActions;