'use strict';

const mongoose = require('mongoose');
const actorDataSchema = require('./actorData');

const Schema = mongoose.Schema;

const gameSchema = new Schema(
	{
		userId:  Schema.Types.ObjectId,
		isFinished  :  Boolean,
		movesCount:  Number,
		totalOfGame: String,
		userColor: String,
		boardSize: Number,
		level: String,
		mode: String,
		startTime: Date,
		gameTime: String,
		actorsData: [actorDataSchema],    
		
	},
	{versionKey: false}   //отключение поля __v, которое указывает на версию документа
);

module.exports = gameSchema;
