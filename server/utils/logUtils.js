'use strict';

const fs = require('fs');
const format = require('node.date-time');
const config = require('../config');

const logUtils = new function() {

    // логирует ошибки БД в консоль
    this.consoleLogDbErrors = function(data) {
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

    this.logTime = function() {
        return new Date().format("dd-MM-y HH:mm:SS");
    };

    this.fileLogMessage = function(message) {
        return fs.appendFile(config.logFileName, (this.logTime() + ' : ' + message + '\n'), function(error){
            if (error) {
                console.error('fileLogger error: ' + error);
            }

            return true;
        });
    }

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
                                this.fileLogMessage(error.message);
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