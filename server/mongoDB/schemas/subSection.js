'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// подраздел
const subSectionSchema = new Schema(
	{
		senderId: Schema.Types.ObjectId,   // id отправителя
		editorId: Schema.Types.ObjectId,   // id последнего редактировавшего
		editDate: Date,    // дата редактирования
		sectionId: Schema.Types.ObjectId,   // id раздела, в котором этот подраздел
		name: String,    // название подраздела
		description: String,   // описание
		orderNumber: Number,   // номер в списке подразделов
	},
	{versionKey: false}
);

module.exports = subSectionSchema;
