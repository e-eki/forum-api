'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		login     : { type: String },
		email     : { type: String },
		confirmEmailCode: { type: String },
		isEmailConfirmed : {type: Boolean },
		password     : { type: String },
		resetPasswordCode: { type: String },
		role     : { type: String },
	},
	{versionKey: false}   //отключение поля __v, которое указывает на версию документа
);

module.exports = userSchema;
