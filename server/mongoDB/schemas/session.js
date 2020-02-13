'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// сессия
const sessionSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId },  // id юзера
		refreshToken: { type: String },           // рефреш токен
		fingerprint: { type: String },            // данные об устройстве юзера
		expiresIn: {type: Number }                // время жизни сессии
	},
	{versionKey: false}
);

module.exports = sessionSchema;
