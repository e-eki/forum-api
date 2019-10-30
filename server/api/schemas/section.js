'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sectionSchema = new Schema(
	{
		id: { type: String },
		name: { type: String },
		description: { type: String },
	},
	{versionKey: false}
);

module.exports = sectionSchema;
