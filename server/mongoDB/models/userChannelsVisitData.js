'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const userChannelsVisitDataSchema = require('../schemas/userChannelsVisitData');

const UserChannelsVisitDataModel = mongoose.model('UserChannelsVisitData', userChannelsVisitDataSchema);

module.exports = {
	
	query: function(config) {

		if (config) {
			return UserChannelsVisitDataModel.aggregate([
				{$match: { '_id': new ObjectId(config.id)}},
				{$project: {
							_id: 0, id: "$_id",
							userId: 1,
							visitData: 1,  //?
				}}
			]);
		}
	},
	
	create: function(data) {
		const userChannelsVisitData = new UserChannelsVisitDataModel({
			userId: data.userId, 
			visitData: data.visitData,
		});
	
		return userChannelsVisitData.save();
	},

	update: function(id, data) {
		const userChannelsVisitData = new UserChannelsVisitDataModel({
			_id: id,
			userId: data.userId,   //??
			visitData: data.visitData,
		});

		return UserChannelsVisitDataModel.findOneAndUpdate({_id: id}, userChannelsVisitData, {new: true});
	},
	
	delete: function(id) {
		return UserChannelsVisitDataModel.findOneAndRemove({_id: id});
	},
}