'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// данные юзера
const userSchema = new Schema(
	{
		email: { type: String },   // имейл
		password: { type: String },   // пароль
		resetPasswordCode: { type: String },  // код для сброса пароля
		role: { type: String },   // роль
		inBlackList: { type: Boolean },    // находится ли юзер в ЧС форума
		editorId: Schema.Types.ObjectId,   // id последнего редактировавшего
		editDate: Date,   // дата редактирования
	},
	{versionKey: false}
);

module.exports = userSchema;
