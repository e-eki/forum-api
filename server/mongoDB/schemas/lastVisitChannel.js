'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// данные о последнем просмотре юзером чата
const lastVisitChannelSchema = new Schema(
	{
		channelId: {type: Schema.Types.ObjectId },  // id чата
		date: { type: Date },  // дата последнего просмотра
	},
	{versionKey: false}
);

module.exports = lastVisitChannelSchema;
