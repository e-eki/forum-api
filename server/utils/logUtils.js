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
    this.initFileLogger() = function() {
        const message = this.logTime() + ': ' + 'Start logging\n';

        fs.appendFile(config.logFileName, message);
    }

    this.logTime() = function() {
        return new Date().format("d-M-y H:m:s");
    }

    // логирует ошибки БД в файл
    this.fileLogDbErrors = function(data) {
        if (data) {
            const dbResponses = data.length ? data : [data];  //?

            dbResponses.forEach(dbResponse => {
                if (dbResponse && dbResponse.errors) {
                    dbErrors.forEach((error) => {
                        const message = this.logTime() + ': ' + error.message + '\n';

                        fs.appendFile(config.logFileName, message);
                    });
                }
            })
        }
    };
    
};

module.exports = logUtils;