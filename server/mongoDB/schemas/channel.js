'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const channelSchema = new Schema(
	{
		senderId: Schema.Types.ObjectId,
		editorId: Schema.Types.ObjectId,
		subSectionId: Schema.Types.ObjectId ,
		name: String,
		description: String,
		descriptionMessageId: {type: Schema.Types.ObjectId, default: null },
	},
	{versionKey: false}
);

module.exports = channelSchema;
