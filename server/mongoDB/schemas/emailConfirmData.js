'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const emailConfirmDataSchema = new Schema(
	{
		email: { type: String },
		fingerprint: { type: String },
	},
	{versionKey: false}
);

module.exports = emailConfirmDataSchema;
