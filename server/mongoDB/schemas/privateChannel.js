'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const privateChannelSchema = new Schema(
	{
		firstSenderId: Schema.Types.ObjectId ,
		secondSenderId: Schema.Types.ObjectId ,
		descriptionMessageId: {type: Schema.Types.ObjectId, default: null },
	},
	{versionKey: false}
);

module.exports = privateChannelSchema;
