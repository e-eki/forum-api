'use strict';

const NODE_ENV = process.env.NODE_ENV || 'development';

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
        , from: '"Форум." <forum@gmail.com>'
        , confirmEmailSubject: 'Подтверждение адреса электронной почты на форуме «Сферический в вакууме»'
        , resetPasswordSubject: 'Восстановление пароля на форуме «Сферический в вакууме»'
    }

    , token: {
        secret: 'b2NjdXB5TWFycw=='
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
};