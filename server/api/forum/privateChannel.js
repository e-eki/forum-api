'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const logUtils = require('../../utils/logUtils');
const privateChannelModel = require('../../mongoDB/models/privateChannel');
const messageModel = require('../../mongoDB/models/message');
const channelUtils = require('../../utils/channelUtils');
const rightsUtils = require('../../utils/rightsUtils');
const tokenUtils = require('../../utils/tokenUtils');
const errors = require('../../utils/errors');
const responses = require('../../utils/responses');
const userVisitUtils = require('../../utils/userVisitUtils');

let router = express.Router();

//----- endpoint: /api/forum/private-channel/
router.route('/private-channel')

  // если в req.query есть recipientId (id получателя), то получение личного чата юзера и получателя
  // если нет, то всех личных чатов юзера
  /*query = {
		  recipientId
	}*/
  .get(function(req, res) {
    const recipientId = req.query.recipientId || null;
    let user = null;

    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(result => {
        user = result;

        const config = {
          userId: user.id,
        };

        if (recipientId) {
          config.recipientId = recipientId;
        }

        return Promise.resolve(privateChannelModel.query(config));
      })
      .then(privateChannels => {
        const tasks = [];

        if (privateChannels.length) {
          tasks.push(channelUtils.getNamesForPrivateChannels(privateChannels, user.id));
        }
        else {
          tasks.push(false);
        }
        
        return Promise.all(tasks);
      })
      .spread(privateChannels => {
        const tasks = [];
        
        //если ищем чат по id получателя - то это будет один приватный чат (текущий)
        if (recipientId && privateChannels) {   
          const privateChannel = privateChannels[0];
          tasks.push(channelUtils.getMessagesDataForChannel(privateChannel, user.id));
        }
        if (privateChannels.length) {
          tasks.push(channelUtils.getMessagesDataForChannels(privateChannels, user.id));
        }
        else {
          tasks.push(false);
        }
        
        return Promise.all(tasks);
      })
      .spread(privateChannels => {
        let result;

        // если ищем чат по id получателя - то это будет один личный чат (текущий)
        if (recipientId) {
          result = privateChannels || null;
        }
        else  {
          if (privateChannels.length && (privateChannels.length > 1)) {
            result = channelUtils.sortChannelsByLastMessageDate(privateChannels);
          }
          else {
            result = privateChannels || [];
          }
        }

        //get rights
        //const addPrivateChannelRights = user ? rightsUtils.isRightsValidForAddPrivateChannel(user) : false;

        if (result) {
          if (recipientId) {
            const editDeletePrivateChannelRights = user ? rightsUtils.isRightsValidForEditDeletePrivateChannel(user, result) : false;
  
            // права управления личным чатом для данного юзера
            /*result.canAdd =*/ result.canEdit = result.canDelete = editDeletePrivateChannelRights;
  
            if (result.messages && result.messages.length) {
              result.messages.forEach(message => {
                const editDeleteMessageRights = user ? rightsUtils.isRightsValidForEditDeleteMessage(user, message) : false;
      
                // права управления сообщением для данного юзера
                message.canEdit = message.canDelete = editDeleteMessageRights;
                message.canMove = false;  // личные сообщения нельзя перемещать
              })
            }
          }
          else if (result.length) {
            result.forEach(privateChannel => {
              const editDeletePrivateChannelRights = user ? rightsUtils.isRightsValidForEditDeletePrivateChannel(user, privateChannel) : false;
  
              // права управления личным чатом для данного юзера
              /*privateChannel.canAdd =*/ privateChannel.canEdit = privateChannel.canDelete = editDeletePrivateChannelRights;
              privateChannel.canMove = false;  // личные чаты нельзя перемещать
            })
          }
        }

        return utils.sendResponse(res, result);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      });
  })

  // создание нового приватного чата
  /*data = {
		recipientId
	}*/
  .post(function(req, res) {
    const recipientId = req.body.recipientId;
    let senderId;
    let privateChannelId;

    return Promise.resolve(true)
			.then(() => {
        const validationErrors = [];

				//validate req.body
				if (!req.body.recipientId || req.body.recipientId == '') {
					validationErrors.push('empty recipientId');
				}
				if (validationErrors.length !== 0) {
					throw utils.initError(errors.FORBIDDEN, validationErrors);
        }

				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(user => {
        // проверяем права
        if (!user ||
            !rightsUtils.isRightsValidForAddPrivateChannel(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        senderId = user.id;

        const data = {
          recipientId: req.body.recipientId,
          senderId: user.id
        };

        return privateChannelModel.create(data);
      })
      .then(dbResponse => {
        logUtils.fileLogDbErrors(dbResponse);

        privateChannelId = (dbResponse._doc && dbResponse._doc._id) ? dbResponse._doc._id.toString() : null;

        const tasks = [];

        // сразу после создания личного чата пишем, что оба юзера только что его просмотрели
        // (нужно для корректного подсчета кол-ва новых сообщений)
        tasks.push(userVisitUtils.updateLastVisitChannel(recipientId, privateChannelId));
        tasks.push(userVisitUtils.updateLastVisitChannel(senderId, privateChannelId));

        return Promise.all(tasks);
      })
      .then(dbResponse => {
        logUtils.fileLogDbErrors(dbResponse);

				return utils.sendResponse(res, {text: 'successfully saved', id: privateChannelId, senderId: senderId}, responses.CREATED_RESPONSE.status);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
  })
  
  .put(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
  })
  
  .delete(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})
;

//----- endpoint: /api/forum/private-channel/:id
router.route('/private-channel/:id')

  // получение приватного чата по его id
  .get(function(req, res) {
    let user = null;
    
    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
        const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
        return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(result => {
        user = result;

        return privateChannelModel.query({id: req.params.id});
      })
      .then(results => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const privateChannel = results[0];

        // проверяем права
        if (!user ||
            (user.id.toString() !== privateChannel.senderId.toString() &&
            user.id.toString() !== privateChannel.recipientId.toString())) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        return channelUtils.getNameForPrivateChannel(privateChannel, user.id);
      })
      .then(privateChannel => {
        return channelUtils.getMessagesDataForChannel(privateChannel, user.id);
      })
      .then((privateChannel) => {
        //get rights
        const editDeletePrivateChannelRights = user ? rightsUtils.isRightsValidForEditDeletePrivateChannel(user, privateChannel) : false;

        // права управления личным чатом для данного юзера
        privateChannel.canAdd = privateChannel.canEdit = privateChannel.canDelete = editDeletePrivateChannelRights;
        privateChannel.canMove = false;  // личный чат нельзя перемещать

        privateChannel.messages.forEach(message => {
          const editDeleteMessageRights = user ? rightsUtils.isRightsValidForEditDeleteMessage(user, message) : false;

          // права управления сообщением для данного юзера
          message.canEdit = message.canDelete = editDeleteMessageRights;
          message.canMove = false;  // личные сообщения нельзя перемещать
          message.canEditChannel = editDeletePrivateChannelRights;
        })

        return utils.sendResponse(res, privateChannel);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      });
  })

  .post(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

  // редактирование данных приватного чата по его id
  /*data = {
		  descriptionMessageId
	}*/
  .put(function(req, res) {
    const privateChannelId = req.params.id;
    let user;

    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
        const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);

        return tokenUtils.checkAccessTokenAndGetUser(accessToken);
      })
      .then(result => {
        user = result;
        
        return privateChannelModel.query({id: privateChannelId});
			})
			.then(results => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const privateChannel = results[0];

        // проверяем права
        if (!user ||
          !rightsUtils.isRightsValidForEditDeletePrivateChannel(user, privateChannel)) {
            throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
      }

        const data = {
          senderId: privateChannel.senderId,
          recipientId: privateChannel.recipientId,
          editorId: user.id,
          descriptionMessageId: req.body.descriptionMessageId || null,
        };

        return privateChannelModel.update(privateChannelId, data);
      })
      .then(dbResponse => {
        logUtils.fileLogDbErrors(dbResponse);

        return utils.sendResponse(res, responses.CREATED_RESPONSE.status);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error);
      });
  })

  // удаление приватного чата по его id
  .delete(function(req, res) {
    const deleteTasks = [];
    let user;

    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
        const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
        
        const tasks = [];
				
        tasks.push(tokenUtils.checkAccessTokenAndGetUser(accessToken));
        
        tasks.push(privateChannelModel.query({id: req.params.id}));

        return Promise.all(tasks);
			})
			.spread((result, results) => {
        user = result;

        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const privateChannel = results[0];

        // проверяем права
        if (!user ||
            !rightsUtils.isRightsValidForEditDeletePrivateChannel(user, privateChannel)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        deleteTasks.push(privateChannelModel.delete(req.params.id));

        return messageModel.query({channelId: req.params.id});
      })
      .then(messages => {
        // удаляем все сообщения данного личного чата
        if (messages && messages.length) {
          messages.forEach(item => {
            deleteTasks.push(messageModel.delete(item.id));
          })
        }

        return Promise.all(deleteTasks);
      })
      .then(dbResponse => {
        logUtils.fileLogDbErrors(dbResponse);
        
        return utils.sendResponse(res);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      })
  })
;

module.exports = router;
