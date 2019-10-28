'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const refreshTokenSchema = new Schema(
	{
		userId     : { type: String },
		refreshToken: { type: String }
	},
	{versionKey: false}   //отключение поля __v, которое указывает на версию документа
);

module.exports = refreshTokenSchema;
