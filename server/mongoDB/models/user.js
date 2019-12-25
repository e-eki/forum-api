'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const userSchema = require('../schemas/user');

const UserModel = mongoose.model('User', userSchema);

module.exports = {
	
	query: function(config) {
		if (config) {
			if (config.id) {
				return UserModel.aggregate([
					{$match: { '_id': new ObjectId(config.id)}},
					{$project: {
						_id: 0, id: "$_id",
						email: 1,
						password: 1,
						resetPasswordCode: 1,
						role: 1,
						inBlackList: 1,
					}}
				]);
			}
			else if (config.email) {
				return UserModel.aggregate([
					{$match: { 'email': config.email}},
					{$project: {
						_id: 0, id: "$_id",
						email: 1,
						password: 1,
						resetPasswordCode: 1,
						role: 1,
						inBlackList: 1,
					}}
				]);
			}
		}	

		return [];
		// return UserModel.aggregate([
		// 	{$project: {
		// 		_id: 0, id: "$_id",
		// 		email: 1,
		// 		password: 1,
		// 		resetPasswordCode: 1,
		// 		role: 1,
		// 		inBlackList: 1,
		// 	}}
		// ]);
	},
	
	create: function(data) {
		const user = new UserModel({
			email: data.email,
			password: data.password,
			resetPasswordCode: data.resetPasswordCode,
			role: data.role,
			inBlackList: data.inBlackList,
		});
	
		return user.save();
	},

	update: function(id, data) {
		const user = new UserModel({
			_id: id,
			email: data.email,
			password: data.password,
			resetPasswordCode: data.resetPasswordCode,
			role: data.role,
			inBlackList: data.inBlackList,
		});

		return UserModel.findOneAndUpdate({_id: id}, user, {new: true});
	},
	
	delete: function(id) {
		return UserModel.findOneAndRemove({_id: id});
	},
}