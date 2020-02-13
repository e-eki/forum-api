'use strict';

const mongoose = require('mongoose');
const config = require('../config');

// утилиты для работы с БД
module.exports = {
	// установка соединения с БД
	setUpConnection: function() {
		mongoose.connect(config.db.mongo.url, config.db.mongo.options, function (err) {
			if (err) {
				console.error('Db connection error:', err.stack);   // как лучше обработать ошибку??
				process.exit();
			}
			else {
				console.log('Successfully connected');
			} 
		});
	},

	// отключение от БД
	closeConnection: function() {
		// завернут в промис для выполнения перед завершением работы программы
		return Promise.resolve(mongoose.disconnect(function() { }))
			.then(() => {
				console.log('Successfully disconnected');
				return true;
			})
			.catch(err => { 
				console.error('Db disconnection error:', err.stack);
				return true;
			});
	},
}

