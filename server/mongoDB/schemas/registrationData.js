'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// данные о регистрации юзера
const registrationDataSchema = new Schema(
	{
		login: { type: String },   // логин
		email: { type: String },    // имейл
		emailConfirmCode: { type: String },   // код подтверждения имейла
		password: { type: String },  // пароль
		fingerprint: { type: String },   // данные устройства, с которого происходила регистрация
	},
	{versionKey: false}
);

module.exports = registrationDataSchema;
