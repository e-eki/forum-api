'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// личный чат
const privateChannelSchema = new Schema(
	{
		recipientId: Schema.Types.ObjectId,  // id получателя
		senderId: Schema.Types.ObjectId,    // id отправителя
		editorId: Schema.Types.ObjectId,    // id последнего редактировавшего
		editDate: Date,  // дата редактирования
		descriptionMessageId: {type: Schema.Types.ObjectId, default: null },   // id закрепленного сообщения
	},
	{versionKey: false}
);

module.exports = privateChannelSchema;
