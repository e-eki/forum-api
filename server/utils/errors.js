'use strict';

// используемые типы ошибок
const errors = {
    INTERNAL_SERVER_ERROR: {message: 'Internal server error', status: 500}   
    , INVALID_INPUT_DATA: {message: 'Invalid input data', status: 400}
    , VALIDATION_ERROR: {message: 'Validation data error', status: 400}
    , UNAUTHORIZED: {message: 'User authorization reqired', status: 401}
    , FORBIDDEN: {message: 'Access is denied', status: 403}
    , NOT_FOUND: {message: 'Resource is not found', status: 404}
    , UNSUPPORTED_METHOD: {message: 'Method is not supported', status: 404}   //??400
};

module.exports = errors;
