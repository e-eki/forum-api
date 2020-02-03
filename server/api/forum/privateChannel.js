'use strict';

const express = require('express');
const Promise = require('bluebird');
const ObjectId = require('mongoose').Types.ObjectId;
const utils = require('../../utils/baseUtils');
const logUtils = require('../../utils/logUtils');
const privateChannelModel = require('../../mongoDB/models/privateChannel');
const messageModel = require('../../mongoDB/models/message');
const channelUtils = require('../../utils/channelUtils');
const rightsUtils = require('../../utils/rightsUtils');
const tokenUtils = require('../../utils/tokenUtils');
const errors = require('../../utils/errors');
const responses = require('../../utils/responses');

let router = express.Router();

//----- endpoint: /api/forum/private-channel/
router.route('/private-channel')

  /*query = {
		  recipientId
	}*/
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

        const config = {
          userId: user.id,
        };

        if (req.query.recipientId) {
          config.recipientId = req.query.recipientId;
        }

        return Promise.resolve(privateChannelModel.query(config));
      })
      .then(privateChannels => {
        const tasks = [];

        if (privateChannels && privateChannels.length) {
          //если ищем чат по id получателя - то это будет один приватный чат (текущий)
          if (req.query.recipientId) {
            const privateChannel = privateChannels[0];

            tasks.push(channelUtils.getNameForPrivateChannel(privateChannel, user.id));
          }
          // иначе это список приватных чатов
          else {
            tasks.push(channelUtils.getNamesForPrivateChannels(privateChannels, user.id));
          }
        }
        else {
          tasks.push(false);
        }
        
        return Promise.all(tasks);
      })
      .spread(privateChannels => {
        const tasks = [];

        if (privateChannels && privateChannels.length) {
          if (req.query.recipientId) {
            const privateChannel = privateChannels[0];

            tasks.push(channelUtils.getMessagesDataForChannel(privateChannel, user.id));
          }
          else {
            tasks.push(channelUtils.getMessagesDataForChannels(privateChannels, user.id));
          }
        }
        else {
          tasks.push(false);
        }
        
        return Promise.all(tasks);
      })
      .spread(privateChannels => {
        let result;

        if (privateChannels && privateChannels.length && (privateChannels.length > 1)) {
          result = channelUtils.sortChannelsByLastMessageDate(privateChannels);
        }
        else {
          result = privateChannels || [];
        }

        //get rights
        //const addPrivateChannelRights = user ? rightsUtils.isRightsValidForAddPrivateChannel(user) : false;

        if (result.length) {
          result.forEach(privateChannel => {
            const editDeletePrivateChannelRights = user ? rightsUtils.isRightsValidForEditDeletePrivateChannel(user, privateChannel) : false;

            /*privateChannel.canAdd =*/ privateChannel.canEdit = privateChannel.canDelete = editDeletePrivateChannelRights;
          })
        }
        else {
          const editDeletePrivateChannelRights = user ? rightsUtils.isRightsValidForEditDeletePrivateChannel(user, result) : false;

          /*result.canAdd =*/ result.canEdit = result.canDelete = editDeletePrivateChannelRights;

          if (result.messages && result.messages.length) {
            result.messages.forEach(message => {
              const editDeleteMessageRights = user ? rightUtils.isRightsValidForEditDeleteMessage(user, message) : false;
    
              message.canEdit = message.canDelete = editDeleteMessageRights;
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
            !rightsUtils.isRightsValid(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const data = {
          recipientId: req.body.recipientId,
          senderId: user.id
        };

        return privateChannelModel.create(data);
      })
      .then((dbResponse) => {
        logUtils.fileLogDbErrors(dbResponse);

        const id = (dbResponse._doc && dbResponse._doc._id) ? dbResponse._doc._id.toString() : null;
        const senderId = (dbResponse._doc && dbResponse._doc._senderId) ? dbResponse._doc._senderId.toString() : null;  //?

				return utils.sendResponse(res, {text: 'successfully saved', id: id, senderId: senderId}, responses.CREATED_RESPONSE.status);
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
            (new ObjectId(user.id) !== new ObjectId(privateChannel.senderId) &&
            new ObjectId(user.id) !== new ObjectId(privateChannel.recipientId))) {  //todo: check!
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

        privateChannel.canAdd = privateChannel.canEdit = privateChannel.canDelete = editDeletePrivateChannelRights;

        privateChannel.messages.forEach(message => {
          const editDeleteMessageRights = user ? rightUtils.isRightsValidForEditDeleteMessage(user, message) : false;

          message.canEdit = message.canDelete = editDeleteMessageRights;
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
			.spread((user, results) => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const privateChannel = results[0];

        // проверяем права
        if (!user ||
            !rightsUtils.isRightsValid(user) ||
            (new ObjectId(user.id) !== new ObjectId(privateChannel.senderId) &&
            new ObjectId(user.id) !== new ObjectId(privateChannel.recipientId))) {  //todo: check!
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const data = {
          //senderId: req.body.senderId,
          descriptionMessageId: req.body.descriptionMessageId,
        };

        return privateChannelModel.update(req.params.id, data);
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
			.spread((user, results) => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const privateChannel = results[0];

        // проверяем права
        if (!user ||
            !rightsUtils.isRightsValid(user) ||
            (new ObjectId(user.id) !== new ObjectId(privateChannel.senderId) &&
            new ObjectId(user.id !== privateChannel.recipientId))) {  //todo: check!
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        deleteTasks.push(privateChannelModel.delete(req.params.id));

        return messageModel.query({channelId: req.params.id});
      })
      .then(messages => {

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
