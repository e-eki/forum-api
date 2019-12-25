'use strict';

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const config = require('./config');
const mongoDbUtils = require('./utils/mongoDbUtils');
const utils = require('./utils/baseUtils');
const indexHTML = path.resolve('./front-end/public/index.html');
const socket = require('./socket/initSocket');

const app = express();
const http = require('http').Server(app);

// инициализация сокетов
const io = socket.initSocket(http);

// const io = require('socket.io')(http);

// // подключения клиентов
// io.on('connection', function(client){
//     console.log('connection!');

//     client.on('action', function(action){
//         //io.emit('chat message', msg);
        
//         if (action && action.type) {
//             switch (action.type) {
// 				case actionTypes.UPDATE_SECTIONS:
					
// 					break;
				
// 				default:
// 					throw utils.initError('INTERNAL_SERVER_ERROR');
//             }
//         }
//     });

//     io.emit('state', 1123);
// });

// статические файлы
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

// ---------------------------------------------------------------
// запросы к api
app.use('/api', require('./api/auth/registration'));
app.use('/api', require('./api/auth/emailConfirm'));
// app.use('/api', require('./api/auth/login'));
// app.use('/api', require('./api/auth/logout'));
// app.use('/api', require('./api/auth/resetPassword'));
// app.use('/api', require('./api/auth/refreshTokens'));
app.use('/api', require('./api/auth/user'));

app.use('/api', require('./api/forum/section'));
app.use('/api', require('./api/forum/subSection'));
app.use('/api', require('./api/forum/channel'));
app.use('/api', require('./api/forum/privateChannel'));
app.use('/api', require('./api/forum/message'));
app.use('/api', require('./api/forum/userInfo'));

// app.use('/api', require(`./api/auth/${config.apiRoutes.registration}`));
// app.use('/api', require(`./api/auth/${config.apiRoutes.emailConfirm}`));
// // app.use('/api', require(`./api/auth/${config.apiRoutes.login}`));
// // app.use('/api', require(`./api/auth/${config.apiRoutes.logout}`));
// // app.use('/api', require(`./api/auth/${config.apiRoutes.resetPassword}`));
// // app.use('/api', require(`./api/auth/${config.apiRoutes.refreshTokens}`));
// app.use('/api', require(`./api/auth/${config.apiRoutes.user}`));

// app.use('/api', require(`./api/forum/${config.apiRoutes.section}`));
// app.use('/api', require(`./api/forum/${config.apiRoutes.subSection}`));
// app.use('/api', require(`./api/forum/${config.apiRoutes.channel}`));
// app.use('/api', require(`./api/forum/${config.apiRoutes.privateChannel}`));
// app.use('/api', require(`./api/forum/${config.apiRoutes.message}`));
// app.use('/api', require(`./api/forum/${config.apiRoutes.userInfo}`));

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

http.listen(config.server.port, () => {   //app.listen
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
