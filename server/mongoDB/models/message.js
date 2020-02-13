'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const messageSchema = require('../schemas/message');

// модель для работы с сообщениями
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
						editorId: 1,
						editDate: 1,
						recipientId: 1,
						channelId: 1,
						date: 1,
						text: 1,
					}}
				]);
			}
			else if (config.searchText) {
				return MessageModel.aggregate([
					{'$match': {'text': { $regex: `${config.searchText}`}, 'recipientId': null}},
					{'$sort': {'date': 1}},  //-1?
					{$project: {
						_id: 0, id: "$_id",
						senderId: 1,
						editorId: 1,
						editDate: 1,
						recipientId: 1,
						channelId: 1,
						date: 1,
						text: 1,
					}}
				]);
			}
			else if (config.channelId) {
				// получить последнее по дате сообщение
				if (config.getLastMessage) {
					return MessageModel.aggregate([
						{'$match': { 'channelId': new ObjectId(config.channelId)}},
						{'$sort': {'date': -1}},
						{'$limit': 1},					
						{$project: {
							_id: 0, id: "$_id",
							senderId: 1,
							date: 1,
							text: 1,
						}}
					]);
				}
				// получить кол-во сообщений с датой, позже указанной
				else if (config.getCount) {   //&& config.channelLastVisitDate?
					return MessageModel.count(
						// db.collection.find( { a: { $gt: 5 }, b: 5 } ).count()
						// db.collection.find( { a: 5, b: 5, c: 5 } ).count()
						{ 'channelId': new ObjectId(config.channelId), 'date': { $gt: config.channelLastVisitDate}} /*&& { 'date': { $gt: config.channelLastVisitDate}}*/		
					);
				}
				else {
					return MessageModel.aggregate([
						{'$match': { 'channelId': new ObjectId(config.channelId)}},
						{'$sort': {'date': 1}},  // по дате по возрастанию!
						{$project: {
							_id: 0, id: "$_id",
							senderId: 1,
							editorId: 1,
							editDate: 1,
							recipientId: 1,
							channelId: 1,
							date: 1,
							text: 1,
						}}
					]);
				}
			}
		}	

		return [];   //?

		// return MessageModel.aggregate([
		// 	{'$sort': {'date': 1}},  // по дате по возрастанию!
		// 	{$project: {
		// 		_id: 0, id: "$_id",
		// 		senderId: 1,
		// 		recipientId: 1,
		// 		channelId: 1,
		// 		date: 1,
		// 		text: 1,
		// 	}}
		// ]);
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
			_id: id,
			date: data.date,
			text: data.text,
			senderId: data.senderId,
			editorId: data.editorId,
			recipientId: data.recipientId,
			channelId: data.channelId,
			editDate: new Date(),
		});

		return MessageModel.findOneAndUpdate({_id: id}, message, {new: true});
	},
	
	delete: function(id) {
		return MessageModel.findOneAndRemove({_id: id});
	},
}