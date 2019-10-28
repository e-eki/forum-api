'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const actorDataSchema = new Schema(
	{
		color: String, 
		type: String, 
		x: Number, 
		y: Number,
	},
	{versionKey: false}   //отключение поля __v, которое указывает на версию документа
);

module.exports = actorDataSchema;
