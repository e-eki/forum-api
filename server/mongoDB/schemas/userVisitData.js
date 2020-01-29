'use strict';

const mongoose = require('mongoose');
const lastVisitChannelSchema = require('./lastVisitChannel');

const Schema = mongoose.Schema;

const userVisitDataSchema = new Schema(
	{
		userId: {type: Schema.Types.ObjectId },
		lastVisitData: [lastVisitChannelSchema],
	},
	{versionKey: false}
);

module.exports = userVisitDataSchema;
