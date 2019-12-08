'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const privateChannelSchema = new Schema(
	{
		recipientId: Schema.Types.ObjectId ,
		senderId: Schema.Types.ObjectId ,
		descriptionMessageId: {type: Schema.Types.ObjectId, default: null },
		//name: String, //todo!
		lastVisitDate: Date,
	},
	{versionKey: false}
);

module.exports = privateChannelSchema;
