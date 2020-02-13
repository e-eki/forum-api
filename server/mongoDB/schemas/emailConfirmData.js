'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// данные о запросе письма с повторным подтверждением почты
const emailConfirmDataSchema = new Schema(
	{
		email: { type: String },  // почта, которую подтвердить
		fingerprint: { type: String },  // данные устройства, с которого был отправлен запрос
	},
	{versionKey: false}
);

module.exports = emailConfirmDataSchema;
