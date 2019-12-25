'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const confirmDataSchema = require('../schemas/emailConfirmData');

const ConfirmDataModel = mongoose.model('EmailConfirmData', confirmDataSchema);

module.exports = {

	query: function(config) {
		if (config) {
			if (config.fingerprint && config.getCount) {
				return ConfirmDataModel.count(
					{ 'fingerprint': config.fingerprint}		
				);
			}
			else if (config.email) {
				return ConfirmDataModel.aggregate([
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
		const regData = new ConfirmDataModel({
			email: data.email,
			fingerprint: data.fingerprint,
		});
	
		return regData.save();
	},

	// update: function(id, data) {
	// },
	
	delete: function(id) {
		return ConfirmDataModel.findOneAndRemove({_id: id});
	},
}