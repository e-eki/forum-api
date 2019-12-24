'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const registrationDataSchema = new Schema(
	{
		login: { type: String },
		email: { type: String },
		emailConfirmCode: { type: Schema.Types.ObjectId },   //?
		password: { type: String },
		fingerprint: { type: String },
	},
	{versionKey: false}
);

module.exports = registrationDataSchema;
