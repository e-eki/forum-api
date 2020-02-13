'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const sessionSchema = require('../schemas/session');

// модель для работы с сессиями
const SessionModel = mongoose.model('Session', sessionSchema);

module.exports = {
	
	query: function(config) {
		if (config) {
			if (config.id) {
				return SessionModel.aggregate([
					{$match: { '_id': new ObjectId(config.id)}},
					{$project: {
						_id: 0, id: "$_id",
						userId: 1,
						refreshToken: 1,
						fingerprint: 1,
						expiresIn: 1,
					}}
				]);
			}
			else if (config.userId) {
				return SessionModel.aggregate([
					{$match: { 'userId': new ObjectId(config.userId)}},
					{$project: {
						_id: 0, id: "$_id",
						userId: 1,
						refreshToken: 1,
						fingerprint: 1,
						expiresIn: 1,
					}}
				]);
			}
			else if (config.refreshToken) {
				return SessionModel.aggregate([
					{$match: { 'refreshToken': config.refreshToken}},
					{$project: {
						_id: 0, id: "$_id",
						userId: 1,
						refreshToken: 1,
						fingerprint: 1,
						expiresIn: 1,
					}}
				]);
			}
		}

		return [];
		// return SessionModel.aggregate([
		// 	{$project: {
		// 		_id: 0, id: "$_id",
		// 		userId: 1,
		// 		refreshToken: 1,
		// 		fingerprint: 1,
		// 		expiresIn: 1,
		// 	}}
		// ]);
	},
	
	create: function(data) {
		const session = new SessionModel({
			userId: data.userId,
			refreshToken: data.refreshToken,
			fingerprint: data.fingerprint,
			expiresIn: data.expiresIn,
		});
	
		return session.save();
	},

	update: function(id, data) {
		const session = new SessionModel({
			_id: id,
			userId: data.userId,
			refreshToken: data.refreshToken,
			fingerprint: data.fingerprint,
			expiresIn: data.expiresIn,
		});

		return SessionModel.findOneAndUpdate({_id: id}, session, {new: true});
	},
	
	delete: function(id) {
		return SessionModel.findOneAndRemove({_id: id});
	},
}