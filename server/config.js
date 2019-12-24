'use strict';

const NODE_ENV = process.env.NODE_ENV || 'development';
const forumName = 'Сферический в вакууме';

module.exports = {
    version: '1.0'
    , server: {
        port: 3000   //process.env.PORT || 3000
        , host: (NODE_ENV == 'development') ? 'localhost' : 'checkers-game0.herokuapp.com'  
        , protocol: (NODE_ENV == 'development') ? 'http' : "https"
    }
    // для запуска фронта на другом порту
    , app: {
        port: (NODE_ENV == 'development') ? 8080 : (process.env.PORT || 3000)
    }
    , db : {
        mongo : {
            url: 'mongodb://e:e123456@ds046677.mlab.com:46677/ch'
            , options: {
                autoReconnect: (process.env.NODE_ENV == 'production')  //??
                , useNewUrlParser: true 
            }
        }
    }
    , bcrypt: {
        saltLength: 10
    } 
    , mail_settings: {
        service: 'Gmail' 
        , auth: { 
            user: 'checkers.game.online', 
            pass: 'qwerty12345_'
        }
        , from: `"Форум «${forumName}»." <forum@gmail.com>`
        , confirmEmailSubject: `Подтверждение адреса электронной почты на форуме «${forumName}»`
        , resetPasswordSubject: `Восстановление пароля на форуме «${forumName}»`
    }
    , security: {
        // количество попыток регистрации (и отправления письма с кодом) - с одного устройства (с одним fingerprint)
        regAttempsMaxCount: 10,
        // количество запросов на повторное подтверждение почты (м.б. разные имейлы) - с одного устройства (с одним fingerprint)
        emailConfirmLettersCount: 5,
        // количество сессий юзера (со скольких устройств юзер может быть залогинен единовременно)
        userSessionsCount: 2,
    }
    , token: {
        secret: 'b2NjdXB5TWFycw=='
        , algorithm: 'HS512'
        , access: {
            type: 'access',
            expiresIn: 120000   //2 мин = 2*60*1000
            //expiresIn: 7200000   //2 ч = 120*60*1000   //TODO!!
          },
        
          refresh: {
            type: 'refresh',
            expiresIn: 3600000  //60 мин
          },
    }
    ,userRoles: {
        // админ может всё: добавление/удаление/изменение разделов/подразделов/чатов/сообщений,
        // назначение/отмена назначения юзера админом/модератором,
        // внесение/отмена внесения юзера в ЧС (бан на форуме)
        admin: 'admin',

        // модератор может: удалять/добавлять/изменять чаты/сообщения,
        // внесение/отмена внесения юзера в ЧС (бан на форуме)
        moderator: 'moderator',

        // юзер может: добавлять чаты, изменять только созданные им же чаты,
        // добавлять сообщения, удалять/изменять только созданные им же сообщения
        user: 'user',

        // доступно всем: добавление/удаление/изменение личных чатов и сообщений (если не в ЧС),
        // редактирование своей личной информации (если не в ЧС)
    }
    , socialRedirectUri: (NODE_ENV == 'development') ? 'http://localhost:3000/api/login' : 'https://checkers-game0.herokuapp.com/api/login'   //??
    , vk: {
        clientId: 6711833
        , secret: 'rOrwLNZOUlqmqXqZNhhZ'
        , ver: 5.69
    }
    , fb: {
        clientId: 455348051621476
        , secret: '5659aab04ba4524050c5b15c64ebd421'
    }
    , google: {
        clientId: '100666725887-otk617ad9448ec49096hufs8001hhel3.apps.googleusercontent.com'
        , secret: '3elLUQtox2HzRoUYmX-rapi1'
        , grantType: 'authorization_code'
    }

    //-----
    , defaultRoomId: '0'
    , forumName: forumName   //?
};