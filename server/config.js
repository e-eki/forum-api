'use strict';

const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
    version: '1.0'
    , server: {
        port: process.env.PORT || 3000
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
        , from: '"Игра в шашки онлайн." <checkers.game.online@gmail.com>'
        , confirmEmailSubject: 'Подтверждение адреса электронной почты на сайте «Игра в шашки онлайн.»'
        , resetPasswordSubject: 'Восстановление пароля на сайте «Игра в шашки онлайн.»'
    }

    , token: {
        secret: 'ZnVja2luZyBmdWNraW5nIGJvcnNjaA=='
        , access: {
            //expiresIn: 1200000   //20 мин = 20*60*1000
            expiresIn: 7200000   //2 ч = 120*60*1000   //TODO!!
          },
        
          refresh: {
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
};