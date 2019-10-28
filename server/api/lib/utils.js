'use strict';

const bcrypt = require('bcryptjs');
const Promise = require('bluebird');
const uuidv5 = require('uuid/v5');
const config = require('../../config');
const errors = require('./errors');

const utils = new function() {

    // 
	/*data = {
		error: <  error object {statusCode: name: message: data:} | string >,
		status: < number >,
		data: < error detail data >,
	}*/
    this.initError = function(error, data, status) {
        let _error = {
            __type: 'api.error'
            , statusCode: status || 500
            , name: errors.INTERNAL_SERVER_ERROR.name
            , message: errors.INTERNAL_SERVER_ERROR.message
            , data: null
        };

        if (typeof error === 'indefined' || error === null) {
            return _error;
        }

        if (error.constructor.name === 'Error') {
            _error.name = error.name;
            _error.message = error.message;
            if (data) _error.data = data;
        }
        else if (error.constructor.name === 'String' && errors[error]) {
            _error.name = errors[error].name;
            _error.message = errors[error].message;
            // в data может быть message (если string)
            if (data) {
                if (data.constructor.name === 'String') {
                    _error.message = data;
                }
                else {
                    _error.data = data;
                }
            }
            if (errors[error].status) _error.statusCode = errors[error].status;
        }
        else {
            if (error.name) _error.name = error.name;
            if (error.message) _error.message = error.message;
            if (data) _error.data = data;
        }

        return _error;
    };

    this.sendResponse = function(res, response, statusCode) {
        let status = statusCode || 200;
        let responseData = response ? response : 'OK'; //??

        return res.status(status).send(responseData);
    };

	this.sendErrorResponse = function(res, error, statusCode, data) {
        const err = (error.__type === 'api.error') ? error : this.initError(error, data, statusCode);
        
        const status = err.statusCode || 500;
        delete err.statusCode;

        return res.status(status).send(err);
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

    //генерирует уникальный идентификатор
    this.makeUId = function(string) {
        return uuidv5(string, uuidv5.URL);   //??
    };

    // логгирует ошибки БД
    this.logDbErrors = function(dbErrors) {
        dbErrors.forEach((error) => {
            console.error('Database error: ' + error.message);
        });
    };
    
};

module.exports = utils;