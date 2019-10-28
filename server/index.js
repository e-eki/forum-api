'use strict';

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const config = require('./config');
const mongoDbUtils = require('./api/lib/mongoDbUtils');
const utils = require('./api/lib/utils');
const Promise = require('bluebird');

const indexHTML = path.resolve('./front-end/public/index.html');
const app = express();

// статические файлы
//app.use('/', express.static('front-end/public'));
app.use(express.static('front-end/public'));

app.use((req, res, next) => {
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    });

    if (req.method === 'OPTIONS') {
        return res.set({'Allow': 'OPTIONS, GET, POST, PUT, DELETE'}).status(200).end();
    }
    next();
});

app.use(bodyParser.json({type: 'application/json'}));
//app.use(bodyParser.urlencoded({ extended: true }));

// ---------------------------------------------------------------
// запросы к api
app.use('/api', require('./api/auth/registration'));
app.use('/api', require('./api/auth/emailConfirm'));
app.use('/api', require('./api/auth/login'));
app.use('/api', require('./api/auth/logout'));
app.use('/api', require('./api/auth/resetPassword'));
app.use('/api', require('./api/auth/refreshTokens'));

app.use('/api', require('./api/routes/user'));
app.use('/api', require('./api/routes/lkUserData'));
app.use('/api', require('./api/routes/game'));
app.use('/api', require('./api/routes/gameTurn'));

// ---------------------------------------------------------------

// на все остальные запросы отдаем главную страницу
app.get('/*', (req, res) => res.sendFile(indexHTML));

// Если произошла ошибка валидации, то отдаем 400 Bad Request
app.use((req, res, next) => {
    const error = utils.initError('NOT_FOUND', 'url does not exist');
    return utils.sendErrorResponse(res, error);
});

// Если же произошла иная ошибка, то отдаем 500 Internal Server Error
app.use((error, req, res, next) => {
    return utils.sendErrorResponse(res, error);
});

app.listen(config.server.port, () => {
    //соединение с БД
    mongoDbUtils.setUpConnection();

    console.log(`Hosted on:  ${config.server.host}:${config.server.port}`);
});

// прослушиваем прерывание работы программы (ctrl-c)
process.on("SIGINT", () => {
    // отключение от БД  (??)
    return Promise.resolve(mongoDbUtils.closeConnection())
        .then(() => {
            process.exit();
        })
});
