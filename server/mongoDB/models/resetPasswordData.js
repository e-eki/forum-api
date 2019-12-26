'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const resetDataSchema = require('../schemas/resetPasswordData');

const ResetDataModel = mongoose.model('ResetPasswordData', resetDataSchema);

module.exports = {

	query: function(config) {
		if (config) {
			if (config.fingerprint && config.getCount) {
				return ResetDataModel.count(
					{ 'fingerprint': config.fingerprint}		
				);
			}
			else if (config.email) {
				return ResetDataModel.aggregate([
					{$match: { 'email': config.email}},
					{$project: {
						_id: 0, id: "$_id",
						email: 1,
						fingerprint: 1,
					}}
				]);
			}
		}	

		return [];  //?
	},
	
	create: function(data) {
		const resetData = new ResetDataModel({
			email: data.email,
			fingerprint: data.fingerprint,
		});
	
		return resetData.save();
	},

	// update: function(id, data) {
	// },
	
	delete: function(id) {
		return ResetDataModel.findOneAndRemove({_id: id});
	},
}