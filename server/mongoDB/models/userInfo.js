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
							nickName: 1,
							name: 1,
							birthDate: 1,
							city: 1,
							profession: 1,
							hobby: 1,
							citation: 1,
				}}
			]);
		}	

		return UserInfoModel.aggregate([
			{$project: {
				_id: 0, id: "$_id",
				userId: 1,
				nickName: 1,
				name: 1,
				birthDate: 1,
				city: 1,
				profession: 1,
				hobby: 1,
				citation: 1,
			}}
		]);
	},
	
	create: function(data) {
		const userInfo = new UserInfoModel({
			userId: data.userId, 
			nickName: data.nickName,
			name: data.name,
			birthDate: data.birthDate,
			city: data.city,
			profession: data.profession,
			hobby: data.hobby,
			citation: data.citation,
		});
	
		return userInfo.save();
	},

	update: function(id, data) {
		const userInfo = new UserInfoModel({
			_id: id,
			userId: data.userId,   //??
			nickName: data.nickName,
			name: data.name,
			birthDate: data.birthDate,
			city: data.city,
			profession: data.profession,
			hobby: data.hobby,
			citation: data.citation,
		});

		return UserInfoModel.findOneAndUpdate({_id: id}, userInfo, {new: true});
	},
	
	delete: function(id) {
		return UserInfoModel.findOneAndRemove({_id: id});
	},
}