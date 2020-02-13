'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// раздел
const sectionSchema = new Schema(
	{
		senderId:  Schema.Types.ObjectId,   // id отправителя
		editorId: Schema.Types.ObjectId,    // id последнего редактировавшего
		editDate: Date,  // дата редактирования
		name: String,    // название раздела
		description: String,   // описание
		orderNumber: Number,   // номер в списке разделов
	},
	{versionKey: false}
);

// sectionSchema.post('save', function(doc) {
// 	console.log('post');
// });

module.exports = sectionSchema;
