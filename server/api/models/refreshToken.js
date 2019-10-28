'use strict';

const mongoose = require('mongoose');
const refreshTokenSchema = require('../schemas/refreshToken');

const RefreshTokenModel = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = {
	
	query: function(config) {
		if (config) return RefreshTokenModel.find(config);
		return RefreshTokenModel.find({});
	},
	
	create: function(data) {
		const refreshToken = new RefreshTokenModel({
			userId     : data.userId,
			refreshToken: data.refreshToken
		});
	
		return refreshToken.save();
	},

	update: function(id, data) {
		const refreshToken = new RefreshTokenModel({
			_id: id,
			userId     : data.userId,
			refreshToken: data.refreshToken,
		});

		return RefreshTokenModel.findOneAndUpdate({_id: id}, refreshToken, {new: true});
	},
	
	delete: function(id) {
		return RefreshTokenModel.findOneAndRemove({_id: id});
	},
}