'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const subSectionSchema = require('../schemas/subSection');

const SubSectionModel = mongoose.model('SubSection', subSectionSchema);

module.exports = {
	
	query: function(config) {
		if (config) {
			return SubSectionModel.aggregate([
				{'$match': { '_id': new ObjectId(config.id)}},
				{$project: {
							_id: 0, id: "$_id",
							name: 1,
							description: 1,
							senderId: 1,
							sectionId: 1
				}}
			]);
		}	

		return SubSectionModel.aggregate([
			{$project: {
				_id: 0, id: "$_id",
				name: 1,
				description: 1,
				senderId: 1,
				sectionId: 1
			}}
		]);
	},
	
	create: function(data) {
		const subSection = new SubSectionModel({
			name: data.name,
			description: data.description,
			//senderId: data.senderId,
			//sectionId: data.sectionId,
		});
	
		return subSection.save();
	},

	update: function(id, data) {
		const subSection = new SubSectionModel({
			_id: id,
			name: data.name,
			description: data.description,
			//senderId: data.senderId,
			//sectionId: data.sectionId,
		});

		return SubSectionModel.findOneAndUpdate({_id: id}, subSection, {new: true});
	},
	
	delete: function(id) {
		return SubSectionModel.findOneAndRemove({_id: id});
	},
}