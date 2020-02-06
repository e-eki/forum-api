'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const subSectionSchema = new Schema(
	{
		senderId: Schema.Types.ObjectId,
		editorId: Schema.Types.ObjectId,
		editDate: Date,
		sectionId: Schema.Types.ObjectId,
		name: String,
		description: String,
		orderNumber: Number,
	},
	{versionKey: false}
);

module.exports = subSectionSchema;
