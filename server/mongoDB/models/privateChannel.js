'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const privateChannelSchema = require('../schemas/privateChannel');

const PrivateChannelModel = mongoose.model('PrivateChannel', privateChannelSchema);

module.exports = {
	
	query: function(config) {
		if (config) {
			if (config.id) {
				return PrivateChannelModel.aggregate([
					{'$match': { '_id': new ObjectId(config.id)}},
					{$project: {
						_id: 0, id: "$_id",
						recipientId: 1,
						senderId: 1,
						descriptionMessageId: 1,
						name: 1,
						lastVisitDate: 1,
					}}
				]);
			}
			else if (config.recipientId && config.userId) {
				return PrivateChannelModel.aggregate([
					{'$match': ({'recipientId': new ObjectId(config.recipientId)} && {'senderId': new ObjectId(config.userId)} ||
								{'recipientId': new ObjectId(config.userId)} && {'senderId': new ObjectId(config.recipientId)})},
					{$project: {
						_id: 0, id: "$_id",
						recipientId: 1,
						senderId: 1,
						descriptionMessageId: 1,
						name: 1,
						lastVisitDate: 1,
					}}
				]);
			}
			else if (config.userId) {
				return PrivateChannelModel.aggregate([
					{'$match': {'senderId': new ObjectId(config.userId)} || {'recipientId': new ObjectId(config.userId)}},
					{$project: {
						_id: 0, id: "$_id",
						recipientId: 1,
						senderId: 1,
						descriptionMessageId: 1,
						name: 1,
						lastVisitDate: 1,
					}}
				]);
			}
		}	

		return PrivateChannelModel.aggregate([
			{$project: {
				_id: 0, id: "$_id",
				recipientId: 1,
				senderId: 1,
				descriptionMessageId: 1,
				name: 1,
				lastVisitDate: 1,
			}}
		]);
	},
	
	create: function(data) {
		const privateChannel = new PrivateChannelModel({
			recipientId: data.recipientId,
			senderId: data.senderId,
			name: data.name,
		});
	
		return privateChannel.save();
	},

	update: function(id, data) {
		const privateChannel = new PrivateChannelModel({
			//_id: id,
			descriptionMessageId: data.descriptionMessageId,
			name: data.name,
			lastVisitDate: data.lastVisitDate,
		});

		return PrivateChannelModel.findOneAndUpdate({_id: id}, privateChannel, {new: true});
	},
	
	delete: function(id) {
		return PrivateChannelModel.findOneAndRemove({_id: id});
	},
}