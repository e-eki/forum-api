'use strict';

const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const sectionSchema = require('../schemas/section');

const SectionModel = mongoose.model('Section', sectionSchema);

module.exports = {
	
	query: function(config) {
		if (config) {
			//return SectionModel.find(config);
			return SectionModel.aggregate([
				{'$match': { '_id': new ObjectId(config)}},
				{$project: {_id: 0, id: "$_id"}}
			]);
		}	

		return SectionModel.find({});
	},
	
	create: function(data) {
		const section = new SectionModel({
			name     : data.name,
			description     : data.description,
		});
	
		return section.save();
	},

	update: function(id, data) {
		const section = new SectionModel({
			_id: id,
			name     : data.name,
			description     : data.description,
		});

		return SectionModel.findOneAndUpdate({_id: id}, section, {new: true});
	},
	
	delete: function(id) {
		return SectionModel.findOneAndRemove({_id: id});
	},
}