'use strict';

//config version for Github

const NODE_ENV = process.env.NODE_ENV || 'development';
// название форума
const forumName = 'Сферический в вакууме';

module.exports = {
    version: '1.0'
    // настройки сервера
    , server: {
        port: 3000   //process.env.PORT || 3000
        , host: (NODE_ENV == 'development') ? 'localhost' : 'forum-messenger.herokuapp.com'  
        , protocol: (NODE_ENV == 'development') ? 'http' : "https"
    }
    // название файла с логами БД
    , logFileName: 'dbLogs.log'
    // настройки соединения с БД
    , db : {
        mongo : {
            url: '<url>'
            , options: {
                autoReconnect: true //(process.env.NODE_ENV == 'production')  //??
                , useNewUrlParser: true 
            }
        }
    }
    // настройки получения хэша
    , bcrypt: {
        saltLength: '<saltLength>'
    }
    // настройки почты
    , mail_settings: {
        service: 'Gmail' 
        , auth: { 
            user: '<user>', 
            pass: '<password>'
        }
        , from: `"Форум «${forumName}»." <snow.trekking.forum@gmail.com>`
        , confirmEmailSubject: `Подтверждение адреса электронной почты на форуме «${forumName}»`
        , resetPasswordSubject: `Восстановление пароля на форуме «${forumName}»`
    }
    // настройки безопасности
    , security: {
        // количество попыток регистрации (и отправления письма с кодом) - с одного устройства (с одним fingerprint)
        regAttemptsMaxCount: 10,
        // количество запросов на повторное подтверждение почты (м.б. разные имейлы) - с одного устройства (с одним fingerprint)
        emailConfirmLettersMaxCount: 5,
        // количество запросов на сброс пароля (м.б. разные имейлы) - с одного устройства (с одним fingerprint)
        resetPasswordLettersMaxCount: 5,
        // количество сессий юзера (со скольких устройств юзер может быть залогинен единовременно)
        userSessionsMaxCount: 2,
        // количество попыток юзера залогиниться через соцсети (подряд)
        socialLoginAttemptsMaxCount: 20,   //?
    }
    // токены
    , token: {
        secret: '<secret>'
        , algorithm: '<algorithm>'
        , access: {
            type: 'access',
            expiresIn: '<expiresIn>'
          },
        
          refresh: {
            type: 'refresh',
            expiresIn: '<expiresIn>'
          },
    }
    // роли юзеров
    ,userRoles: {
        // админ может всё: добавление/удаление/изменение/перемещение разделов/подразделов/чатов/сообщений,
        // назначение/отмена назначения юзера админом/модератором,
        // внесение/отмена внесения юзера в ЧС (бан на форуме)
        admin: 'admin',

        // модератор может: удалять/добавлять/изменять чаты/сообщения,
        // внесение/отмена внесения юзера в ЧС (бан на форуме)
        // но не может вносить в ЧС админа!
        moderator: 'moderator',

        // юзер может: добавлять чаты, изменять только созданные им же чаты,
        // добавлять сообщения, удалять/изменять только созданные им же сообщения
        user: 'user',

        // доступно всем: добавление/удаление/изменение ТОЛЬКО СВОИХ личных чатов и сообщений (если не в ЧС),
        // редактирование своей личной информации (если не в ЧС)
    }
    // ссылка для редиректа при входе через соцсети
    , socialRedirectUri: '<socialRedirectUri>'
    // аутентификация через вконтакте
    , vk: {
        clientId: '<clientId>'
        , secret: '<secret>'
        , ver: 5.69
    }
    , google: {
        clientId: '<clientId>'
        , secret: '<secret>'
        , grantType: 'authorization_code'
    }

    //--- настройки форума

    // id комнаты, к которой присоединяется сокет клиента при открытии главной страницы
    , defaultRoomId: '0'
    // название форума
    , forumName: forumName
    // адреса api
    , apiRoutes: {
        registration: 'registration',
        emailConfirm: 'email-confirm',
        login: 'login',
        logout: 'logout',
        resetPassword: 'reset-password',
        refreshTokens: 'refresh-tokens',
        user: 'user',

        section: 'section',
        subSection: 'subSection',
        channel: 'channel',
        privateChannel: 'private-channel',
        message: 'message',
        userInfo: 'user-info'
    }
    // типы комнат, к которым присоединяются сокеты клиентов - соотв. открытой странице
    , roomTypes: {
		section: 'section',
		subSection: 'subSection',
		channel: 'channel',
		message: 'message',
		privateChannel: 'privateChannel',
		searchChannel: 'searchChannel',
		searchMessage: 'searchMessage',
		userInfo: 'userInfo',
	},
};
