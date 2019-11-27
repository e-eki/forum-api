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
					}}
				]);
			}
			else if (config.recipientId) {
				return PrivateChannelModel.aggregate([
					{'$match': { 'recipientId': new ObjectId(config.recipientId), 'senderId': new ObjectId(config.recipientId)}},
					{$project: {
						_id: 0, id: "$_id",
						recipientId: 1,
						senderId: 1,
						descriptionMessageId: 1,
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
			}}
		]);
	},
	
	create: function(data) {
		const privateChannel = new PrivateChannelModel({
			recipientId: data.recipientId,
			senderId: data.senderId,
		});
	
		return privateChannel.save();
	},

	update: function(id, data) {
		const privateChannel = new PrivateChannelModel({
			//_id: id,
			descriptionMessageId: data.descriptionMessageId,
		});

		return PrivateChannelModel.findOneAndUpdate({_id: id}, privateChannel, {new: true});
	},
	
	delete: function(id) {
		return PrivateChannelModel.findOneAndRemove({_id: id});
	},
}