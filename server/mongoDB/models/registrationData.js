'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const regDataSchema = require('../schemas/registrationData');

// модель для работы с данными о регистрации юзера
const RegDataModel = mongoose.model('RegistrationData', regDataSchema);

module.exports = {

	query: function(config) {
		if (config) {
			if (config.fingerprint && config.getCount) {
				// получить кол-во попыток регистрации
				return RegDataModel.count(
					{ 'fingerprint': config.fingerprint}		
				);
			}
			else if (config.email) {
				return RegDataModel.aggregate([
					{$match: { 'email': config.email}},
					{$project: {
						_id: 0, id: "$_id",
						login: 1,
						email: 1,
						password: 1,
						emailConfirmCode: 1,
					}}
				]);
			}
			else if (config.emailConfirmCode) {
				return RegDataModel.aggregate([
					{$match: { 'emailConfirmCode': config.emailConfirmCode}},
					{$project: {
						_id: 0, id: "$_id",
						login: 1,
						email: 1,
						password: 1,
						emailConfirmCode: 1,
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