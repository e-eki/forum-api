'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const logUtils = require('../../utils/logUtils');
const channelModel = require('../../mongoDB/models/channel');
const messageModel = require('../../mongoDB/models/message');
const channelUtils = require('../../utils/channelUtils');
const sectionModel = require('../../mongoDB/models/section');
const subSectionModel = require('../../mongoDB/models/subSection');
const rightsUtils = require('../../utils/rightsUtils');
const tokenUtils = require('../../utils/tokenUtils');
const errors = require('../../utils/errors');
const responses = require('../../utils/responses');

let router = express.Router();

//----- endpoint: /api/forum/channel/
router.route('/channel')

  // получение всех чатов (для поиска по форуму и для списка родительских элементов для перемещения сообщения)
  .get(function(req, res) { 
    const tasks = [];

    if (req.query.searchText) {
      tasks.push(channelModel.query({searchText: req.query.searchText}));
    }
    else {
      tasks.push(channelModel.query());
    }

    return Promise.all(tasks)
      .spread(channels => {
        const result = channels || [];

        return utils.sendResponse(res, result);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      })
  })

  // создание нового чата
  /*data = {
		name,
    description,
    subSectionId,
    descriptionMessageId
	}*/
  .post(function(req, res) {
    return Promise.resolve(true)
			.then(() => {
        const validationErrors = [];

				//validate req.body
				if (!req.body.name || req.body.name == '') {
					validationErrors.push('empty name');
				}
				if (!req.body.subSectionId || req.body.subSectionId == '') {
					validationErrors.push('empty subSectionId');
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
          name: req.body.name,
          description: req.body.description,
          senderId: user.id,
          subSectionId: req.body.subSectionId,
          descriptionMessageId: req.body.descriptionMessageId,
        };

        return channelModel.create(data);
      })
      .then((dbResponse) => {
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

//----- endpoint: /api/forum/channel/:id
router.route('/channel/:id')

  // получение чата по его id
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

        return channelModel.query({id: req.params.id});
      })
      .then(results => {
        const channel = results[0];

        const tasks = [];

        tasks.push(channel);
        tasks.push(subSectionModel.query({id: channel.subSectionId}));

        return Promise.all(tasks);
      })
      .spread((channel, results) => {
        const tasks = [];
        tasks.push(channel);

        if (results && results.length) {
          const parentSubSection = results[0];

          channel.parentSubSection = {
            id: parentSubSection.id,
            name: parentSubSection.name,
          };

          tasks.push(sectionModel.query({id: parentSubSection.sectionId}));
        }
        else {
          tasks.push(false);
        }

        return Promise.all(tasks);
      })
      .spread((channel, results) => {
        if (results && results.length) {
          const parentSection = results[0];

          channel.parentSection = {
            id: parentSection.id,
            name: parentSection.name,
          }
        }

        const userId = user ? user.id : null;
        return channelUtils.getMessagesDataForChannel(channel, userId);
      })
      .then(channel => {
        //get rights
        const editChannelRights = user ? rightsUtils.isRightsValidForEditChannel(user, channel) : false;
        const moveChannelRights = user ? rightsUtils.isRightsValidForMoveChannel(user) : false;
        const deleteChannelRights = user ? rightsUtils.isRightsValidForDeleteChannel(user) : false;
        const addMessageRights = user ? rightsUtils.isRightsValidForAddMessage(user) : false;
        const moveMessageRights = user ? rightsUtils.isRightsValidForMoveMessage(user) : false;

        channel.canEdit = editChannelRights;
        channel.canMove = moveChannelRights;
        channel.canDelete = deleteChannelRights;
        channel.canAdd = addMessageRights;

        channel.messages.forEach(message => {
          const editDeleteMessageRights = user ? rightsUtils.isRightsValidForEditDeleteMessage(user, message) : false;

          message.canEdit = message.canDelete = editDeleteMessageRights;
          message.canMove = moveMessageRights;
          message.canEditChannel = editChannelRights;
        })
        
        return utils.sendResponse(res, channel);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      });
  })

  .post(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

  // редактирование данных чата по его id
  /*data = {
		name,
    description,
    subSectionId,
    descriptionMessageId
	}*/
  .put(function(req, res) {
    const channelId = req.params.id;
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

        return channelModel.query({id: channelId});
      })
      .then(results => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }
        const channel = results[0];

        // проверяем права
        if (!user ||
          !rightsUtils.isRightsValidForEditChannel(user, channel)) {
            throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const data = {
          name: req.body.name,
          description: req.body.description,
          senderId: channel.senderId,
          editorId: user.id,  //?
          subSectionId: req.body.subSectionId,
          descriptionMessageId: req.body.descriptionMessageId,
        };

        return channelModel.update(channelId, data);
      })
      .then(dbResponse => {
        logUtils.fileLogDbErrors(dbResponse);

        return utils.sendResponse(res, null, responses.CREATED_RESPONSE.status);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error);
      });
  })

  // удаление чата по его id
  .delete(function(req, res) {
    const deleteTasks = [];

    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(user => {
        // проверяем права
        if (!user ||
            !rightsUtils.isRightsValidForDeleteChannel(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        deleteTasks.push(channelModel.delete(req.params.id));

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
      .then(dbResponses => {
        logUtils.fileLogDbErrors(dbResponses);

        return utils.sendResponse(res);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      })
  })
;

module.exports = router;
