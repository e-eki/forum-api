'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const registrationDataSchema = new Schema(
	{
		login: { type: String },
		email: { type: String },
		emailConfirmCode: { type: String },
		password: { type: String },
		fingerprint: { type: String },
	},
	{versionKey: false}
);

module.exports = registrationDataSchema;