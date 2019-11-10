'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const channelSchema = require('../schemas/channel');

const ChannelModel = mongoose.model('Channel', channelSchema);

module.exports = {
	
	query: function(config) {
		if (config) {
			return ChannelModel.aggregate([
				{'$match': { '_id': new ObjectId(config.id)}},
				{$project: {
							_id: 0, id: "$_id",
							name: 1,
							description: 1,
							senderId: 1,
							subSectionId: 1,
							descriptionMessageId: 1,
				}}
			]);
		}	

		return ChannelModel.aggregate([
			{$project: {
				_id: 0, id: "$_id",
				name: 1,
				description: 1,
				senderId: 1,
				subSectionId: 1,
				descriptionMessageId: 1,
			}}
		]);
	},
	
	create: function(data) {
		const channel = new ChannelModel({
			name: data.name,
			description: data.description,
			//senderId: data.senderId,
			subSectionId: data.subSectionId,
			descriptionMessageId: data.descriptionMessageId,
		});
	
		return channel.save();
	},

	update: function(id, data) {
		const channel = new ChannelModel({
			_id: id,
			name: data.name,
			description: data.description,
			//senderId: data.senderId,
			subSectionId: data.subSectionId,
			descriptionMessageId: data.descriptionMessageId,
		});

		return ChannelModel.findOneAndUpdate({_id: id}, channel, {new: true});
	},
	
	delete: function(id) {
		return ChannelModel.findOneAndRemove({_id: id});
	},
}