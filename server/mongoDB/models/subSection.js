'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const subSectionSchema = require('../schemas/subSection');

// модель для работы с подразделами
const SubSectionModel = mongoose.model('SubSection', subSectionSchema);

module.exports = {
	
	query: function(config) {
		if (config) {
			if (config.id) {
				return SubSectionModel.aggregate([
					{'$match': { '_id': new ObjectId(config.id)}},
					{$project: {
						_id: 0, id: "$_id",
						name: 1,
						description: 1,
						senderId: 1,
						editorId: 1,
						editDate: 1,
						sectionId: 1,
						orderNumber: 1
					}}
				]);
			}
			else if (config.sectionId) {
				return SubSectionModel.aggregate([
					{'$match': { 'sectionId': new ObjectId(config.sectionId)}},
					{'$sort': {'orderNumber': 1}},  // по порядку по возрастанию
					{$project: {
						_id: 0, id: "$_id",
						name: 1,
						description: 1,
						senderId: 1,
						editorId: 1,
						editDate: 1,
						sectionId: 1,
						orderNumber: 1
					}}
				]);
			}
		}	

		return SubSectionModel.aggregate([   //?
			{'$sort': {'orderNumber': 1}},  // по порядку по возрастанию
			{$project: {
				_id: 0, id: "$_id",
				name: 1,
				orderNumber: 1
				// description: 1,
				// senderId: 1,
				// sectionId: 1
			}}
		]);
	},
	
	create: function(data) {
		const subSection = new SubSectionModel({
			name: data.name,
			description: data.description,
			senderId: data.senderId,
			sectionId: data.sectionId,
			orderNumber: data.orderNumber,
		});
	
		return subSection.save();
	},

	update: function(id, data) {
		const subSection = new SubSectionModel({
			_id: id,
			name: data.name,
			description: data.description,
			senderId: data.senderId,
			editorId: data.editorId,
			editDate: new Date(),
			sectionId: data.sectionId,
			orderNumber: data.orderNumber,
		});

		return SubSectionModel.findOneAndUpdate({_id: id}, subSection, {new: true});
	},
	
	delete: function(id) {
		return SubSectionModel.findOneAndRemove({_id: id});
	},
}