'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const regDataSchema = require('../schemas/registrationData');

const RegDataModel = mongoose.model('RegistrationData', regDataSchema);

module.exports = {

	query: function(config) {
		if (config) {
			if (config.fingerprint && config.getCount) {
				return RegDataModel.count(
					{ 'fingerprint': new ObjectId(config.fingerprint)}		
				);
			}
			else if (config.email) {
				return RegDataModel.aggregate([
					{$match: { 'email': new ObjectId(config.email)}},
					{$project: {
						_id: 0, id: "$_id",
						login: 1,
						email: 1,
						password: 1,
					}}
				]);
			}
			else if (config.emailConfirmCode) {
				return RegDataModel.aggregate([
					{$match: { 'emailConfirmCode': new ObjectId(config.emailConfirmCode)}},
					{$project: {
						_id: 0, id: "$_id",
						login: 1,
						email: 1,
						password: 1,
					}}
				]);
			}
		}	

		return [];  //?
	},
	
	create: function(data) {
		const regData = new RegDataModel({
			login: data.login,
			email: data.email,
			password: data.password,
			emailConfirmCode: data.emailConfirmCode,
			fingerprint: data.fingerprint,
		});
	
		return regData.save();
	},

	// update: function(id, data) {
	// },
	
	delete: function(id) {
		return RegDataModel.findOneAndRemove({_id: id});
	},
}