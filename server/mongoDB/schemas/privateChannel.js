'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const privateChannelSchema = new Schema(
	{
		recipientId: Schema.Types.ObjectId ,
		senderId: Schema.Types.ObjectId,
		editorId: Schema.Types.ObjectId,
		editDate: Date,
		descriptionMessageId: {type: Schema.Types.ObjectId, default: null },
	},
	{versionKey: false}
);

module.exports = privateChannelSchema;
