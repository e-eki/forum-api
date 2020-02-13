'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// данные юзера (личная информация)
const userInfoSchema = new Schema(
	{
		userId: {type: Schema.Types.ObjectId },  // id юзера
		editorId: {type: Schema.Types.ObjectId },  // id последнего редактировавшего
		editDate: Date,   // дата редактирования
		login: { type: String },   // логин
		name: { type: String },    // имя-фамилия
		birthDate: { type: Date },  // дата рождения
		city: { type: String },     // город
		profession: { type: String },   // профессия
		hobby: { type: String },      // хобби
		captionText: { type: String },  // подпись под аватаром
	},
	{versionKey: false}
);

module.exports = userInfoSchema;
