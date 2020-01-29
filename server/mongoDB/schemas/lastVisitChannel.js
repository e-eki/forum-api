'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const lastVisitChannelSchema = new Schema(
	{
		channelId: {type: Schema.Types.ObjectId },
		date: { type: Date },
	},
	{versionKey: false}
);

module.exports = lastVisitChannelSchema;
