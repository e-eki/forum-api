'use strict';

const bcrypt = require('bcryptjs');
const Promise = require('bluebird');
// const uuidv5 = require('uuid/v5');
const config = require('../config');
const errors = require('./errors');
const responses = require('./responses');

const utils = new function() {

    // 
	/*data = {
		errorData: <  error object >,
		messageData: < string or array of string >,
	}*/
    this.initError = function(errorData, messageData) {
        let error = {};

        error.status = (errorData && errorData.status) ? errorData.status : 500;

        error.message = (errorData && errorData.message) ? errorData.message : '';

        if (messageData) {
            error.message += ':\n';

            if (typeof(messageData) === 'string') {
                error.message += messageData;
            }
            else if (messageData.length) {
                messageData.forEach(item => {
                    error.message += item;
                    error.message += '\n';
                })
            }
        }

        return error;
    };

    this.sendResponse = function(res, responseData, statusCode) {
        const status = statusCode || responses.OK_RESPONSE.status;
        const response = responseData || responses.OK_RESPONSE.message;

        return res.status(status).send(response);
    };

	this.sendErrorResponse = function(res, error) {
        const status = error.status || errors.INTERNAL_SERVER_ERROR.status;
        const message = error.message || errors.INTERNAL_SERVER_ERROR.message;

        return res.status(status).send(message);
    };

    // вычисляет хэш пароля
    this.makePasswordHash = function(password) {
        // оборачиваем в промис вызов функции, тк иначе она промис не возвращает, хоть и асинхронная
        return Promise.resolve(bcrypt.genSalt(config.bcrypt.saltLength))  // генерим соль
            .then((salt) => {
                // берем пароль юзера + соль и генерим хеш
                return bcrypt.hash(password, salt);
            })
    };

    // сравнивает пароль с хэшем пароля из БД
    this.comparePassword = function(password, hash) {
        return Promise.resolve(bcrypt.compare(password, hash));
    };

    // //генерирует уникальный идентификатор
    // this.makeUId = function(string) {
    //     return uuidv5(string, uuidv5.URL);   //??
    // };
};

module.exports = utils;