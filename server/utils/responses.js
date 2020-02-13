'use strict';

// используемые типы http-ответов
const responses = {
    OK_RESPONSE: {message: 'OK', status: 200}   
    , CREATED_RESPONSE: {name: 'created', status: 201}
    , DELETED_RESPONSE: {name: 'deleted', status: 204}
};

module.exports = responses;
