'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sectionSchema = new Schema(
	{
		senderId:  Schema.Types.ObjectId,
		editorId: Schema.Types.ObjectId,
		editDate: Date,
		name: String,
		description: String,
		orderNumber: Number,
	},
	{versionKey: false}
);

// sectionSchema.post('save', function(doc) {
// 	console.log('post');
// });

module.exports = sectionSchema;
