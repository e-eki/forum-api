'use strict';

const ERRORS = {
    INTERNAL_SERVER_ERROR: {name: 'internal_server_error', message: 'Internal server error', status: 500}   
    , INVALID_INPUT_DATA: {name: 'invalid_input_data', message: 'Invalid input data', status: 400}
    , VALIDATION_ERROR: {name: 'validation_error', message: 'Validation data error', status: 400}
    , UNAUTHORIZED: {name: 'UNAUTHORIZED', message: 'User authorization reqired', status: 401}
    , FORBIDDEN: {name: 'FORBIDDEN', message: 'Access is denied', status: 403}
    , NOT_FOUND: {name: 'not_found', message: 'Resource is not found', status: 404}
    , UNSUPPORTED_METHOD: {name: 'unsupported_method', message: 'Method is not supported', status: 404}   //??400
    //, UNKNOWN_QUERY_ERROR: {name: 'unknown_query_error', message: 'Unknown query error'}
    //, SESSION_INVALID: {name: 'session_invalid', message: 'Session data are absent or invalid', status: 403}
    
};

module.exports = ERRORS;
