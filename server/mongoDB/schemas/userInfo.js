'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userInfoSchema = new Schema(
	{
		userId: {type: Schema.Types.ObjectId },
		editorId: {type: Schema.Types.ObjectId },
		editDate: Date,
		login: { type: String },
		name: { type: String },
		birthDate: { type: Date },
		city: { type: String },
		profession: { type: String },
		hobby: { type: String },
		captionText: { type: String },
	},
	{versionKey: false}
);

module.exports = userInfoSchema;
