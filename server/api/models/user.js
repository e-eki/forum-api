'use strict';

const mongoose = require('mongoose');
const userSchema = require('../schemas/user');

const UserModel = mongoose.model('User', userSchema);

module.exports = {
	
	query: function(config) {
		if (config) return UserModel.find(config);		
		return UserModel.find({});
	},
	
	create: function(data) {
		const user = new UserModel({
			login     : data.login,
			email     : data.email,
			confirmEmailCode: data.confirmEmailCode,
			isEmailConfirmed: data.isEmailConfirmed,
			password     : data.password,
			resetPasswordCode: data.resetPasswordCode,
			role: data.role,
		});
	
		return user.save();
	},

	update: function(id, data) {
		const user = new UserModel({
			_id: id,
			login     : data.login,
			email     : data.email,
			confirmEmailCode: data.confirmEmailCode,
			isEmailConfirmed: data.isEmailConfirmed,
			password     : data.password,
			resetPasswordCode: data.resetPasswordCode,
			role: data.role,
		});

		return UserModel.findOneAndUpdate({_id: id}, user, {new: true});
	},
	
	delete: function(id) {
		return UserModel.findOneAndRemove({_id: id});
	},
}