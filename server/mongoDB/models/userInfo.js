'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const userInfoSchema = require('../schemas/userInfo');

const UserInfoModel = mongoose.model('UserInfo', userInfoSchema);

module.exports = {
	
	query: function(config) {

		if (config) {
			return UserInfoModel.aggregate([
				{$match: { '_id': new ObjectId(config.id)}},
				{$project: {
							_id: 0, id: "$_id",
							userId: 1,
							login: 1,
							name: 1,
							birthDate: 1,
							city: 1,
							profession: 1,
							hobby: 1,
							captionText: 1,
				}}
			]);
		}	

		return UserInfoModel.aggregate([
			{$project: {
				_id: 0, id: "$_id",
				userId: 1,
				login: 1,
				name: 1,
				birthDate: 1,
				city: 1,
				profession: 1,
				hobby: 1,
				captionText: 1,
			}}
		]);
	},
	
	create: function(data) {
		const userInfo = new UserInfoModel({
			userId: data.userId, 
			login: data.login,
			name: data.name,
			birthDate: data.birthDate,
			city: data.city,
			profession: data.profession,
			hobby: data.hobby,
			captionText: data.captionText,
		});
	
		return userInfo.save();
	},

	update: function(id, data) {
		const userInfo = new UserInfoModel({
			_id: id,
			userId: data.userId,   //??
			login: data.login,
			name: data.name,
			birthDate: data.birthDate,
			city: data.city,
			profession: data.profession,
			hobby: data.hobby,
			captionText: data.captionText,
		});

		return UserInfoModel.findOneAndUpdate({_id: id}, userInfo, {new: true});
	},
	
	delete: function(id) {
		return UserInfoModel.findOneAndRemove({_id: id});
	},
}