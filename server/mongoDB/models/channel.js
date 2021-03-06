'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const channelSchema = require('../schemas/channel');

// модель для работы с чатами
const ChannelModel = mongoose.model('Channel', channelSchema);

module.exports = {
	
	query: function(config) {
		if (config) {
			if (config.id) {
				return ChannelModel.aggregate([
					{'$match': { '_id': new ObjectId(config.id)}},
					{$project: {
						_id: 0, id: "$_id",
						name: 1,
						description: 1,
						senderId: 1,
						editorId: 1,
						editDate: 1,
						subSectionId: 1,
						descriptionMessageId: 1,
					}}
				]);
			}
			else if (config.subSectionId) {
				return ChannelModel.aggregate([
					{'$match': { 'subSectionId': new ObjectId(config.subSectionId)}},
					{$project: {
						_id: 0, id: "$_id",
						name: 1,
						description: 1,
						senderId: 1,
						editorId: 1,
						editDate: 1,
						subSectionId: 1,
						descriptionMessageId: 1,
					}}
				]);
			}
			else if (config.searchText) {
				return ChannelModel.aggregate([
					{ '$match': { $or: [ {'name': { $regex: `${config.searchText}`}}, {'description': { $regex: `${config.searchText}`}} ] } },
					{$project: {
						_id: 0, id: "$_id",
						name: 1,
						description: 1,
						senderId: 1,
						editorId: 1,
						editDate: 1,
						subSectionId: 1,
						descriptionMessageId: 1,
					}}
				]);
			}
		}	

		return ChannelModel.aggregate([  //?
			{$project: {
				_id: 0, id: "$_id",
				name: 1,
				//description: 1,
				//senderId: 1,
				//editorId: 1,
				//subSectionId: 1,
				//descriptionMessageId: 1,
			}}
		]);
	},
	
	create: function(data) {
		const channel = new ChannelModel({
			name: data.name,
			description: data.description,
			senderId: data.senderId,
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
			senderId: data.senderId,
			editorId: data.editorId,
			editDate: new Date(),
			subSectionId: data.subSectionId,
			descriptionMessageId: data.descriptionMessageId,
		});

		return ChannelModel.findOneAndUpdate({_id: id}, channel, {new: true});
	},
	
	delete: function(id) {
		return ChannelModel.findOneAndRemove({_id: id});
	},
}