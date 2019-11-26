'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const privateChannelSchema = require('../schemas/privateChannel');

const PrivatePrivateChannelModel = mongoose.model('PrivateChannel', privateChannelSchema);

module.exports = {
	
	query: function(config) {
		if (config) {
			if (config.id) {
				return PrivatePrivateChannelModel.aggregate([
					{'$match': { '_id': new ObjectId(config.id)}},
					{$project: {
						_id: 0, id: "$_id",
						firstSenderId: 1,
						secondSenderId: 1,
						descriptionMessageId: 1,
					}}
				]);
			}
			else if (config.senderId) {
				return PrivateChannelModel.aggregate([
					{'$match': { 'firstSenderId': new ObjectId(config.senderId), 'secondSenderId': new ObjectId(config.senderId)}},
					{$project: {
						_id: 0, id: "$_id",
						firstSenderId: 1,
						secondSenderId: 1,
						descriptionMessageId: 1,
					}}
				]);
			}
		}	

		return PrivateChannelModel.aggregate([
			{$project: {
				_id: 0, id: "$_id",
				firstSenderId: 1,
				secondSenderId: 1,
				descriptionMessageId: 1,
			}}
		]);
	},
	
	create: function(data) {
		const privateChannel = new PrivateChannelModel({
			firstSenderId: data.firstSenderId,
			secondSenderId: data.secondSenderId,
			descriptionMessageId: data.descriptionMessageId,
		});
	
		return privateChannel.save();
	},

	update: function(id, data) {
		const privateChannel = new PrivateChannelModel({
			//_id: id,
			// firstSenderId: data.firstSenderId,
			// secondSenderId: data.secondSenderId,
			descriptionMessageId: data.descriptionMessageId,
		});

		return PrivateChannelModel.findOneAndUpdate({_id: id}, privateChannel, {new: true});
	},
	
	delete: function(id) {
		return PrivateChannelModel.findOneAndRemove({_id: id});
	},
}