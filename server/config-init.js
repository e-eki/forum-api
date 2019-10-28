'use strict';

//config version for Github

const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
    version: '1.0'
    , server: {
        port: process.env.PORT || 3000
        , host: (NODE_ENV == 'development') ? 'localhost' : 'checkers-game0.herokuapp.com'  
        , protocol: (NODE_ENV == 'development') ? 'http' : "https"
    }
    , db : {
        mongo : {
            url: 'mongodb://<dbuser>:<dbpassword>@ds046677.mlab.com:46677/ch'
            , options: {
                autoReconnect: (process.env.NODE_ENV == 'production')
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
            user: '<user>', 
            pass: '<password>'
        }
        , from: '"Игра в шашки онлайн." <checkers.game.online@gmail.com>'
        , confirmEmailSubject: 'Подтверждение адреса электронной почты на сайте «Игра в шашки онлайн.»'
    }

    , token: {
        secret: '<token_secret>'
        , access: {
            expiresIn: 1200000   //20 мин = 20*60*1000
          },
        
          refresh: {
            expiresIn: 3600000  //60 мин
          },
    }
};