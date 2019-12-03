'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
//const Date = require('mongoose').Types.Date;
const messageSchema = require('../schemas/message');

const MessageModel = mongoose.model('Message', messageSchema);

module.exports = {
	
	query: function(config) {
		if (config) {
			if (config.id) {
				return MessageModel.aggregate([
					{'$match': { '_id': new ObjectId(config.id)}},
					{$project: {
						_id: 0, id: "$_id",
						senderId: 1,
						recipientId: 1,
						channelId: 1,
						date: 1,
						text: 1,
					}}
				]);
			}
			else if (config.channelId) {
				return MessageModel.aggregate([
					{'$match': { 'channelId': new ObjectId(config.channelId)}},
					{$project: {
						_id: 0, id: "$_id",
						senderId: 1,
						recipientId: 1,
						channelId: 1,
						date: 1,
						text: 1,
					}}
				]);
			}
			else if (config.searchText) {
				return MessageModel.aggregate([
					{'$match': {'text': { $regex: `${config.searchText}`}}},
					{$project: {
						_id: 0, id: "$_id",
						senderId: 1,
						recipientId: 1,
						channelId: 1,
						date: 1,
						text: 1,
					}}
				]);
			}
		}	

		return MessageModel.aggregate([
			{$project: {
				_id: 0, id: "$_id",
				senderId: 1,
				recipientId: 1,
				channelId: 1,
				date: 1,
				text: 1,
			}}
		]);
	},
	
	create: function(data) {
		const message = new MessageModel({
			date: new Date(),
			text: data.text,
			senderId: data.senderId,
			recipientId: data.recipientId,
			channelId: data.channelId,
		});
	
		return message.save();
	},

	update: function(id, data) {
		const message = new MessageModel({
			//_id: id,
			date: data.date,
			text: data.text,
			//senderId: data.senderId,
			recipientId: data.recipientId,
			channelId: data.channelId,
		});

		return MessageModel.findOneAndUpdate({_id: id}, message, {new: true});
	},
	
	delete: function(id) {
		return MessageModel.findOneAndRemove({_id: id});
	},
}