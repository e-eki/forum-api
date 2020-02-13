'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// сообщение
const messageSchema = new Schema(
	{
		senderId: Schema.Types.ObjectId,   // id отправителя
		editorId: Schema.Types.ObjectId,   // id последнего редактировавшего
		editDate: Date,  // дата редактирования
		recipientId: {type: Schema.Types.ObjectId, default: null },  // id получателя
		channelId: {type: Schema.Types.ObjectId, default: null },  // id чата
		date: Date,   // дата создания
		text: String,  // текст
	},
	{versionKey: false}
);

module.exports = messageSchema;
