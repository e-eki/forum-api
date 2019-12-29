'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const channelModel = require('../../mongoDB/models/channel');
const messageModel = require('../../mongoDB/models/message');
const messageUtils = require('../../utils/messageUtils');
const rightsUtils = require('../../utils/rigthsUtils');

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
  .post(function(req, res) {
    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(user => {
        // проверяем права
        if (!rightsUtils.isRightsValid(user)) {
          throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const data = {
          date: req.body.date,
          text: req.body.text,
          senderId: req.body.senderId,
          recipientId: req.body.recipientId,
          channelId: req.body.channelId,
        };

        return messageModel.create(data);
      })
      .then(dbResponse => {
        utils.logDbErrors(dbResponse);

				const id = (dbResponse._doc && dbResponse._doc._id) ? dbResponse._doc._id.toString() : null;

				return utils.sendResponse(res, {text: 'successfully saved', id: id}, 201);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
			});
  })
  
  .put(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
  })
  
  .delete(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})
;

//----- endpoint: /api/forum/message/:id
router.route('/message/:id')

  // получение сообщения по его id
  .get(function(req, res) {      
    return messageModel.query({id: req.params.id})
      .then(data => {
        return messageUtils.getSenderNamesInMessages(messages);
      })
      .then(data => {
        const message = (data && data.length) ? data[0] : null;

        return utils.sendResponse(res, message);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
  })

  .post(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

  // редактирование данных сообщения по его id
  .put(function(req, res) {
    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(user => {
        // проверяем права
        if (!rightsUtils.isRightsValid(user) ||
            (req.body.senderId !== user.id)) {   //todo: check!
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const data = {
          date: req.body.date,
          text: req.body.text,
          senderId: req.body.senderId,
          recipientId: req.body.recipientId,
          channelId: req.body.channelId,
        };

        return messageModel.update(req.params.id, data);
      })
      .then(dbResponse => {
        utils.logDbErrors(dbResponse);

        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
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
          
        }

        // проверяем права
        if (!rightsUtils.isRightsValid(user) ||
            (req.body.senderId !== user.id)) {   //todo: check!
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

    const tasks = [];

    tasks.push(messageModel.delete(req.params.id));
    tasks.push(channelModel.query({descriptionMessageId: req.params.id}));

    return Promise.all(tasks)
      .spread((dbResponse, result) => {

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
        return utils.sendResponse(res);  //??data
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error, 500);
      })
  })
;

module.exports = router;
