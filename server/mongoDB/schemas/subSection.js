'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const subSectionSchema = new Schema(
	{
		senderId: Schema.Types.ObjectId ,
		sectionId: Schema.Types.ObjectId ,
		name: String,
		description: String,
	},
	{versionKey: false}
);

module.exports = subSectionSchema;
