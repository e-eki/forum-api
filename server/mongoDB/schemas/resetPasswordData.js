'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const resetPasswordDataSchema = new Schema(
	{
		email: { type: String },
		fingerprint: { type: String },
	},
	{versionKey: false}
);

module.exports = resetPasswordDataSchema;
