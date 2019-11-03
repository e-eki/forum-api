'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userInfoSchema = new Schema(
	{
		userId: {type: Schema.Types.ObjectId },
		nickName: { type: String },
		name: { type: String },
		birthDate: { type: Date },
		city: { type: String },
		profession: { type: String },
		hobby: { type: String },
		citation: { type: String },
	},
	{versionKey: false}
);

module.exports = userInfoSchema;
