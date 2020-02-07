'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const logUtils = require('../../utils/logUtils');
const channelModel = require('../../mongoDB/models/channel');
const messageModel = require('../../mongoDB/models/message');
const messageUtils = require('../../utils/messageUtils');
const rightsUtils = require('../../utils/rightsUtils');
const tokenUtils = require('../../utils/tokenUtils');
const errors = require('../../utils/errors');
const responses = require('../../utils/responses');

let router = express.Router();

//----- endpoint: /api/forum/message/
router.route('/message')

  // получение всех сообщений (для поиска по форуму)
  .get(function(req, res) { 
    const tasks = [];

    if (req.query.searchText) {
      tasks.push(messageModel.query({searchText: req.query.searchText}));
    }
    else {
      tasks.push(false);
    }

    return Promise.all(tasks)
      .spread(messages => {
        return messageUtils.getSenderNamesInMessages(messages);
      })
      .then(messages => {
        return utils.sendResponse(res, messages);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      })
  })

  // создание нового сообщения
  /*data = {
		date,
    text,
    recipientId,
    channelId
	}*/
  .post(function(req, res) {
    return Promise.resolve(true)
			.then(() => {
        const validationErrors = [];

				//validate req.body
				// if (!req.body.date || req.body.date == '') {
				// 	validationErrors.push('empty date');
				// }
				if (!req.body.text || req.body.text == '') {
					validationErrors.push('empty text');
        }
        if ((!req.body.recipientId || req.body.recipientId == '') &&
            (!req.body.channelId || req.body.channelId == '')) {
					    validationErrors.push('empty recipientId & channelId');
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
            !rightsUtils.isRightsValidForAddMessage(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const data = {
          date: new Date(),
          text: req.body.text,
          senderId: user.id,
          recipientId: req.body.recipientId,
          channelId: req.body.channelId,
        };

        return messageModel.create(data);
      })
      .then(dbResponse => {
        logUtils.fileLogDbErrors(dbResponse);

				const id = (dbResponse._doc && dbResponse._doc._id) ? dbResponse._doc._id.toString() : null;

				return utils.sendResponse(res, {text: 'successfully saved', id: id}, responses.CREATED_RESPONSE.status);
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

//----- endpoint: /api/forum/message/:id
router.route('/message/:id')

  // получение сообщения по его id
  .get(function(req, res) {   
    let user = null;

    return Promise.resolve(true)
      .then(() => {
        //get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
        return tokenUtils.checkAccessTokenAndGetUser(accessToken)
          .catch(error => {
            return null;
          })
      })
      .then(result => {
        user = result;
    
        return messageModel.query({id: req.params.id});
      })
      .then(data => {
        return messageUtils.getSenderNamesInMessages(messages);
      })
      .then(data => {
        const message = (data && data.length) ? data[0] : null;

        //get rights
        const editDeleteMessageRights = user ? rightUtils.isRightsValidForEditDeleteMessage(user, message) : false;

        message.canEdit = message.canDelete = editDeleteMessageRights;

        return utils.sendResponse(res, message);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
  })

  .post(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

  // редактирование данных сообщения по его id
  /*data = {
		date,
    text,
    channelId
	}*/
  .put(function(req, res) {
    const messageId = req.params.id;
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

        return messageModel.query({id: messageId});
      })
      .then(results => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const message = results[0];

        // проверяем права
        if (!user ||
          !rightsUtils.isRightsValidForEditDeleteMessage(user, message)) {
            throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
      }

        const data = {
          date: message.date,
          text: req.body.text,
          senderId: message.senderId,
          recipientId: message.recipientId,
          editorId: user.id,
          editDate: new Date(),
          channelId: req.body.channelId,
        };

        return messageModel.update(req.params.id, data);
      })
      .then(dbResponse => {
        logUtils.fileLogDbErrors(dbResponse);

        return utils.sendResponse(res, null, responses.CREATED_RESPONSE.status);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error);
      });
  })

  // удаление сообщения по его id
  .delete(function(req, res) {
    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
        
        const tasks = [];

        tasks.push(tokenUtils.checkAccessTokenAndGetUser(accessToken));

        tasks.push(messageModel.query({id: req.params.id}));
        
        return Promise.all(tasks);
			})
			.spread((user, results) => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const message = results[0];

        // проверяем права
        if (!user ||
            !rightsUtils.isRightsValidForEditDeleteMessage(user, message)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const tasks = [];

        tasks.push(messageModel.delete(req.params.id));
        tasks.push(channelModel.query({descriptionMessageId: req.params.id}));

        return Promise.all(tasks);
      })
      .spread((dbResponse, result) => {
        logUtils.fileLogDbErrors(dbResponse);

        if (result && result.length) {
          const channel = result[0];
          channel.descriptionMessageId = null;

          return channelModel.update(channel.id, channel);
        }
        else {
          return false;
        }
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
