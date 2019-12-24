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
					{ 'fingerprint': new ObjectId(config.fingerprint)}		
				);
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