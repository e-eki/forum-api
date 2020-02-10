'use strict';

const Promise = require('bluebird');
const userVisitDataModel = require('../mongoDB/models/userVisitData');

const userVisitUtils = new function() {

	// обновление данных о последнем просмотре юзером чата
	this.updateLastVisitChannel = function(userId, channelId) {
		return userVisitDataModel.query({userId: userId})
			.then(results => {
				if (results && results.length) {
					const userVisitData = results[0];

					const newLastVisitChannel = {
						channelId: channelId,
						date: new Date(),
					};

					if (userVisitData.lastVisitData.length) {
						const lastVisitChannel = userVisitData.lastVisitData.find(item => item.channelId.toString() === channelId.toString());    //??

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

					return userVisitDataModel.update(userVisitData.id, userVisitData);
				}
				else {
					return false;  //?
				}
			})
	}

	// сброс данных о просмотрах юзером чатов
    this.resetUserVisitData = function(userId) {
        return userVisitDataModel.query({userId: userId})
			.then(results => {
				if (results && results.length) {
					const userVisitData = results[0];

					userVisitData.lastVisitData = [];

					return userVisitDataModel.update(userVisitData.id, userVisitData);
				}
				else {
					return false; //?
				}
			})
    }
}

module.exports = userVisitUtils;