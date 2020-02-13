'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// данные о попытках входа через соцсети
const socialLoginDataSchema = new Schema(
	{
		userId: Schema.Types.ObjectId,   // id юзера
	},
	{versionKey: false}
);

module.exports = socialLoginDataSchema;
