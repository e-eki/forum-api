'use strict';

const fs = require('fs');
const config = require('../config');

// утилиты для работы с логами
const logUtils = new function() {

    // логирует ошибки БД в консоль
    this.fileLogDbErrors = function(data) {
        if (data) {
            const dbResponses = data.length ? data : [data];  //?

            dbResponses.forEach(dbResponse => {
                if (dbResponse && dbResponse.errors) {
                    dbErrors.forEach((error) => {
                        console.error('Database error: ' + error.message);
                    });
                }
            })
        }
    };

    // инициализирует логгер в файл
    this.initFileLogger = function() {
        return fs.appendFile(config.logFileName, '\n', function(error){
            if (error) {
                console.error('fileLogger error: ' + error);
            }

            return true;
        });
    };

    // возвращает текущую дату в формате, удобном для логов
    this.logTime = function() {
        return new Date().toString();
    };

    // записать строку в файл логов
    this.fileLogMessage = function(message) {
        return fs.appendFile(config.logFileName, (this.logTime() + ' : ' + message + '\n'), function(error){
            if (error) {
                console.error('fileLogger error: ' + error);
            }

            return true;
        });
    }

    // записать строку в файл логов синхронно (?)
    this.fileLogMessageSync = function(message) {
        return fs.appendFileSync(config.logFileName, (this.logTime() + ' : ' + message + '\n'), function(error){
            if (error) {
                console.error('fileLogger error: ' + error);
            }

            return true;
        });
    }

    // логирует ошибки БД в файл
    this.fileLogDbErrors = function(data) {
        return Promise.resolve(true)
            .then(() => {
                const tasks = [];

                if (data) {
                    const dbResponses = data.length ? data : [data];  //?

                    dbResponses.forEach(dbResponse => {
                        if (dbResponse && dbResponse.errors) {
                            dbErrors.forEach((error) => {
                                tasks.push(this.fileLogMessage(error.message));
                            });
                        }
                    })
                }
                else {
                    tasks.push(false);
                }

                return Promise.all(tasks)
            })
            .then(result => true)
            .catch(error => {
                console.error('fileLogger error: ' + error);
            })
    };
    
};

module.exports = logUtils;