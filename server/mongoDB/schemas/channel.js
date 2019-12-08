'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const channelSchema = new Schema(
	{
		senderId: Schema.Types.ObjectId ,
		subSectionId: Schema.Types.ObjectId ,
		name: String,
		description: String,
		descriptionMessageId: {type: Schema.Types.ObjectId, default: null },
		lastVisitDate: Date,
	},
	{versionKey: false}
);

module.exports = channelSchema;
