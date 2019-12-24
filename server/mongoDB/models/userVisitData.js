'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const userVisitDataSchema = require('../schemas/userVisitData');

const UserVisitDataModel = mongoose.model('UserVisitData', userVisitDataSchema);

module.exports = {
	
	query: function(config) {
		if (config && config.id) {
			return UserVisitDataModel.aggregate([
				{$match: { '_id': new ObjectId(config.id)}},
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
			lastVisitData: data.visitData,
		});
	
		return userVisitData.save();
	},

	update: function(id, data) {
		const userVisitData = new UserVisitDataModel({
			_id: id,
			userId: data.userId,   //??
			lastVisitData: data.visitData,
		});

		return UserVisitDataModel.findOneAndUpdate({_id: id}, userVisitData, {new: true});
	},
	
	delete: function(id) {
		return UserVisitDataModel.findOneAndRemove({_id: id});
	},
}