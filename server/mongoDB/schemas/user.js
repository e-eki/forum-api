'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		email: { type: String },
		confirmEmailCode: { type: String },
		isEmailConfirmed: {type: Boolean },
		password: { type: String },
		resetPasswordCode: { type: String },
		role: { type: String },
		inBlackList: { type: Boolean },
	},
	{versionKey: false}
);

module.exports = userSchema;
