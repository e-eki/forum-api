'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sectionSchema = new Schema(
	{
		senderId: {type: Schema.Types.ObjectId, default: null },
		name: String,
		description: String,
	},
	{versionKey: false}
);

// sectionSchema.post('save', function(doc) {
// 	console.log('post');
// });

module.exports = sectionSchema;
