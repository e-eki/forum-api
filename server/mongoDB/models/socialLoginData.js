'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const socialLoginDataSchema = require('../schemas/socialLoginData');

const LoginDataModel = mongoose.model('SocialLoginData', socialLoginDataSchema);

module.exports = {

	query: function(config) {
		if (config) {
			if (config.id) {
				return LoginDataModel.aggregate([
					{$match: { '_id': new ObjectId(config.id)}},
					{$project: {
						_id: 0, id: "$_id",
						userId: 1,
					}}
				]);
			}
			else if (config.userId) {
				return LoginDataModel.aggregate([
					{$match: { 'userId': new ObjectId(config.userId)}},
					{$project: {
						_id: 0, id: "$_id",
						userId: 1,
					}}
				]);
			}
		}	

		return [];  //?
	},
	
	create: function(data) {
		const loginData = new LoginDataModel({
			userId: data.userId,
		});
	
		return loginData.save();
	},

	// update: function(id, data) {
	// },
	
	delete: function(id) {
		return LoginDataModel.findOneAndRemove({_id: id});
	},
}