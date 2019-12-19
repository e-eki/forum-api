'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userChannelsVisitDataSchema = new Schema(
	{
		userId: {type: Schema.Types.ObjectId },
		visitData: [
			{
				channelId: Schema.Types.ObjectId,
				date: Date
			}
		],
	},
	{versionKey: false}
);

module.exports = userChannelsVisitDataSchema;
