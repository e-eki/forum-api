'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userVisitDataSchema = new Schema(
	{
		userId: {type: Schema.Types.ObjectId },
		lastVisitData: [
			{
				channelId: Schema.Types.ObjectId,
				date: Date
			}
		],
	},
	{versionKey: false}
);

module.exports = userVisitDataSchema;
