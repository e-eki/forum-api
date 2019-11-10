'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const sectionSchema = require('../schemas/section');

const SectionModel = mongoose.model('Section', sectionSchema);

module.exports = {
	
	query: function(config) {
		// if (config) {
		// 	return SectionModel.find(config);
		// }	
		// return SectionModel.find({});

		if (config) {
			if (config.id) {
				return SectionModel.aggregate([
					{$match: { '_id': new ObjectId(config.id)}},
					{$project: {
								_id: 0, id: "$_id",
								name: 1,
								description: 1,
								senderId: 1
					}}
				]);
			}
		}	

		return SectionModel.aggregate([
			{$project: {
				_id: 0, id: "$_id",
				name: 1,
				description: 1,
				senderId: 1
			}}
		]);
	},
	
	create: function(data) {
		const section = new SectionModel({
			name: data.name,
			description: data.description,
			userId: data.userId,  //??
		});
	
		return section.save();
	},

	update: function(id, data) {
		const section = new SectionModel({
			_id: id,
			name: data.name,
			description: data.description,
			//userId: data.userId,
		});

		return SectionModel.findOneAndUpdate({_id: id}, section, {new: true});
	},
	
	delete: function(id) {
		return SectionModel.findOneAndRemove({_id: id});
	},
}