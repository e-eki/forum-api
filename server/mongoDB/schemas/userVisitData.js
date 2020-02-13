'use strict';

const mongoose = require('mongoose');
const lastVisitChannelSchema = require('./lastVisitChannel');

const Schema = mongoose.Schema;

// данные о последних просмотрах юзером чатов
const userVisitDataSchema = new Schema(
	{
		userId: {type: Schema.Types.ObjectId },   // id юзера
		lastVisitData: [lastVisitChannelSchema],   // данные о последних просмотрах (массив с id-датой для каждого чата)
	},
	{versionKey: false}
);

module.exports = userVisitDataSchema;
