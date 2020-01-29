'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const lastVisitChannelSchema = require('../schemas/lastVisitChannel');
const userVisitDataSchema = require('../schemas/userVisitData');

const LastVisitChannelModel = mongoose.model('LastVisitChannel', lastVisitChannelSchema);
const UserVisitDataModel = mongoose.model('UserVisitData', userVisitDataSchema);

module.exports = {
	
	query: function(config) {
		if (config && config.userId) {
			return UserVisitDataModel.aggregate([
				{$match: { 'userId': new ObjectId(config.userId)}},
				{$project: {
					_id: 0, id: "$_id",
					userId: 1,
					lastVisitData: 1,  //?
				}}
			]);
		}

		return [];
	},
	
	create: function(data) {
		const userVisitData = new UserVisitDataModel({
			userId: data.userId, 
			lastVisitData: [],  //?
		});
	
		return userVisitData.save();
	},

	update: function(id, data) {
		const lastVisitData = [];

		if (data.lastVisitData.length) {
			data.lastVisitData.forEach(item => {
				const lastVisitChannel = new LastVisitChannelModel({
					channelId: item.channelId,
					date: item.date,
				});
	
				lastVisitData.push(lastVisitChannel);
			});
		}

		const userVisitData = new UserVisitDataModel({
			_id: id,
			userId: data.userId,
			lastVisitData: lastVisitData,  //?
		});

		return UserVisitDataModel.findOneAndUpdate({_id: id}, userVisitData, {new: true});
	},
	
	delete: function(id) {
		return UserVisitDataModel.findOneAndRemove({_id: id});
	},
}