'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// чат
const channelSchema = new Schema(
	{
		senderId: Schema.Types.ObjectId,   // id отправителя
		editorId: Schema.Types.ObjectId,    // id последнего редактировавшего
		editDate: Date,  // дата редактирования
		subSectionId: Schema.Types.ObjectId ,  // id подраздела, в котором чат
		name: String,   // название чата
		description: String,   // описание чата
		descriptionMessageId: {type: Schema.Types.ObjectId, default: null },  // id закрепленного сообщения
	},
	{versionKey: false}
);

module.exports = channelSchema;
