'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const sectionSchema = require('../schemas/section');

const SectionModel = mongoose.model('Section', sectionSchema);

module.exports = {
	
	query: function(config) {

		if (config) {
			if (config.id) {
				return SectionModel.aggregate([
					{$match: { '_id': new ObjectId(config.id)}},
					{$project: {
						_id: 0, id: "$_id",
						name: 1,
						description: 1,
						senderId: 1,
						editorId: 1,
						editDate: 1,
						orderNumber: 1,
					}}
				]);
			}
		}	

		return SectionModel.aggregate([
			{'$sort': {'orderNumber': 1}},  // по порядку по возрастанию
			{$project: {
				_id: 0, id: "$_id",
				name: 1,
				description: 1,
				senderId: 1,
				editorId: 1,
				editDate: 1,
				orderNumber: 1,
			}}
		]);
	},
	
	create: function(data) {
		const section = new SectionModel({
			name: data.name,
			description: data.description,
			senderId: data.senderId,
			orderNumber: data.orderNumber,
		});
	
		return section.save();
	},

	update: function(id, data) {
		const section = new SectionModel({
			_id: id,
			name: data.name,
			description: data.description,
			senderId: data.senderId,
			editorId: data.editorId,
			editDate: new Date(),  //?
			orderNumber: data.orderNumber,
		});

		return SectionModel.findOneAndUpdate({_id: id}, section, {new: true});
	},
	
	delete: function(id) {
		return SectionModel.findOneAndRemove({_id: id});
	},
}