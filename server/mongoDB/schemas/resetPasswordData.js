'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// данные о запросе письма для сброса пароля
const resetPasswordDataSchema = new Schema(
	{
		email: { type: String },   // имейл
		fingerprint: { type: String },  // данные устройства, с которого был отправлен запрос
	},
	{versionKey: false}
);

module.exports = resetPasswordDataSchema;
