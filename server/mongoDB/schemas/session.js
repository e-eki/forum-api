'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sessionSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId },
		refreshToken: { type: String },
		fingerprint: { type: String },
		expiresIn: {type: Number }
	},
	{versionKey: false}
);

module.exports = sessionSchema;