'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const privateChannelSchema = require('../schemas/privateChannel');

// модель для работы с личными чатами
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
						editorId: 1,
						editDate: 1,
						descriptionMessageId: 1,
					}}
				]);
			}
			// получить личный чат двух указанных юзеров
			else if (config.recipientId && config.userId) {
				return PrivateChannelModel.aggregate([
					{ '$match': { $or: [ { $and: [ {'recipientId': new ObjectId(config.recipientId)}, {'senderId': new ObjectId(config.userId)} ] },
										 { $and: [ {'recipientId': new ObjectId(config.userId)}, {'senderId': new ObjectId(config.recipientId)} ] } ] } },
					{$project: {
						_id: 0, id: "$_id",
						recipientId: 1,
						senderId: 1,
						editorId: 1,
						editDate: 1,
						descriptionMessageId: 1,
					}}
				]);
			}
			// получить все личные чаты указанного юзера
			else if (config.userId) {
				return PrivateChannelModel.aggregate([
					{ '$match': { $or: [ {'senderId': new ObjectId(config.userId)}, {'recipientId': new ObjectId(config.userId)} ] } },
					{$project: {
						_id: 0, id: "$_id",
						recipientId: 1,
						senderId: 1,
						editorId: 1,  //?
						editDate: 1,  //?
						descriptionMessageId: 1,
					}}
				]);
			}
		}	

		return [];/*PrivateChannelModel.aggregate([
			{$project: {
				_id: 0, id: "$_id",
				recipientId: 1,
				senderId: 1,
				descriptionMessageId: 1,
				lastVisitDate: 1,
			}}
		]);*/
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
			_id: id,
			descriptionMessageId: data.descriptionMessageId,
			recipientId: data.recipientId,
			senderId: data.senderId,
			editorId: data.editorId,
			editDate: new Date(),
		});

		return PrivateChannelModel.findOneAndUpdate({_id: id}, privateChannel, {new: true});
	},
	
	delete: function(id) {
		return PrivateChannelModel.findOneAndRemove({_id: id});
	},
}