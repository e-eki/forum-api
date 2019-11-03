'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const messageSchema = new Schema(
	{
		senderId: Schema.Types.ObjectId,
		recipientId: {type: Schema.Types.ObjectId, default: null },
		channelId: {type: Schema.Types.ObjectId, default: null },
		date: Date,
		text: String,
	},
	{versionKey: false}
);

module.exports = messageSchema;
