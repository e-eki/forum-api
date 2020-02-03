'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const logUtils = require('../../utils/logUtils');
const subSectionModel = require('../../mongoDB/models/subSection');
const channelModel = require('../../mongoDB/models/channel');
const messageModel = require('../../mongoDB/models/message');
const channelUtils = require('../../utils/channelUtils');
const sectionModel = require('../../mongoDB/models/section');
const rightsUtils = require('../../utils/rightsUtils');
const tokenUtils = require('../../utils/tokenUtils');
const errors = require('../../utils/errors');
const responses = require('../../utils/responses');

let router = express.Router();

//----- endpoint: /api/forum/subsection/
router.route('/subsection')

  // получение всех подразделов (для чего?)
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

        return subSectionModel.query();
      })
      .then(subSections => {
        const result = subSections || [];

        //get rights
        const subSectionRights = user ? rightsUtils.isRightsValidForSubSection(user) : false;
        const addChannelRights = user ? rightsUtils.isRightsValidForCreateChannel(user) : false;

        subSections.forEach(item => {
          item.canEdit = item.canDelete = subSectionRights;
          item.canAdd = addChannelRights;
        })

        return utils.sendResponse(res, result);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      })
  })

  // создание нового подраздела
  /*data = {
		name,
    description,
    sectionId,
	}*/
  .post(function(req, res) {
    let user = null;

    return Promise.resolve(true)
			.then(() => {
        const validationErrors = [];

				//validate req.body
				if (!req.body.name || req.body.name == '') {
					validationErrors.push('empty name');
				}
				if (!req.body.sectionId || req.body.sectionId == '') {
					validationErrors.push('empty sectionId');
        }
        // if (!req.body.orderNumber || req.body.orderNumber == '') {
				// 	validationErrors.push('empty orderNumber');
				// }
				if (validationErrors.length !== 0) {
					throw utils.initError(errors.FORBIDDEN, validationErrors);
        }

				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(result => {
        user = result;

        // проверяем права
        if (!user ||
            !rightsUtils.isRightsValid(user) ||
            !rightsUtils.isRightsValidForSubSection(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        return Promise.resolve(sectionModel.query({id: req.params.id}));
      })
      .then(results => {
        let orderNumber = 0;

        if (results && results.length) {
          const section = results[0];

          if (section.subSections) {
            orderNumber = section.subSections.length;
          }
        }

        const data = {
          name: req.body.name,
          description: req.body.description,
          senderId: user.id,
          sectionId: req.body.sectionId,
          orderNumber: orderNumber,
        };

        return subSectionModel.create(data);
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

//----- endpoint: /api/forum/subsection/:id
router.route('/subsection/:id')

  // получение подраздела по его id
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

        return subSectionModel.query({id: req.params.id});
      })
      .then(results => {
        const subSection = results[0];
        const tasks = [];

        tasks.push(subSection);
        tasks.push(sectionModel.query({id: subSection.sectionId}));

        return Promise.all(tasks);
      })
      .spread((subSection, results) => {
        if (results && results.length) {
          const parentSection = results[0];

          subSection.parentSection = {
            id: parentSection.id,
            name: parentSection.name,
          }
        }

        const tasks = [];

        tasks.push(subSection);
        tasks.push(channelModel.query({subSectionId: subSection.id}));

        return Promise.all(tasks);
      })
      .spread((subSection, channels) => {
        subSection.channels = channels;

        const tasks = [];
        tasks.push(subSection);

        if (channels.length) {
          // ищем кол-во новых сообщений и последнее сообщение в каждом чате - отображаются в подразделе
          const userId = user ? user.id : null;

          tasks.push(channelUtils.getMessagesDataForChannels(channels, userId));
        }
        else {
          tasks.push(false);
        }  

        return Promise.all(tasks);
      })
      .spread((subSection, channels) => {
        if (channels.length && (channels.length > 1)) {
          subSection.channels = channelUtils.sortChannelsByLastMessageDate(channels);
        }

        //get rights
        const subSectionRights = user ? rightsUtils.isRightsValidForSubSection(user) : false;
        const addChannelRights = user ? rightsUtils.isRightsValidForCreateChannel(user) : false;
        const deleteChannelRights = user ? rightsUtils.isRightsValidForDeleteChannel(user) : false;

        subSection.canEdit = subSection.canDelete = subSectionRights;
        subSection.canAdd = addChannelRights;

        subSection.channels.forEach(channel => {
          channel.canDelete = deleteChannelRights;
          channel.canEdit = user ? rightsUtils.isRightsValidForEditChannel(user, channel) : false;
        })

        return utils.sendResponse(res, subSection);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      });
  })

  .post(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

  // редактирование данных подраздела по его id
  /*data = {
		name,
    description,
    sectionId,
    orderNumber
	}*/
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
        if (!user ||
            !rightsUtils.isRightsValid(user) ||
            !rightsUtils.isRightsValidForSubSection(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const data = {
          name: req.body.name,
          description: req.body.description,
          senderId: user.id,   //todo? updaterId
          sectionId: req.body.sectionId,
          orderNumber: req.body.orderNumber,
        };

        return subSectionModel.update(req.params.id, data);
      })
      .then(dbResponse => {
        logUtils.fileLogDbErrors(dbResponse);

        return utils.sendResponse(res, null, responses.CREATED_RESPONSE.status);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error);
      });
  })

  // удаление подраздела по его id
  .delete(function(req, res) {
    const subSectionId = req.params.id;

    const subSectionsUpdateTasks = [];
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
            !rightsUtils.isRightsValid(user) ||
            !rightsUtils.isRightsValidForSubSection(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        return subSectionModel.query();
      })
      .then(subSections => {
        // корректируем номер порядка у всех элементов, следующих за удаляемым
        if (subSections && subSections.length) {
          const subSection = subSections.find(item => item.id.toString() === subSectionId);

          subSections.forEach(item => {
            if ((item.sectionId === subSection.sectionId) &&
                (item.orderNumber > subSection.orderNumber)) {
                  item.orderNumber--;

                  subSectionsUpdateTasks.push(subSectionModel.update(item.id, item));
            }
          })
        }

        deleteTasks.push(subSectionModel.delete(req.params.id));

        return channelModel.query({subSectionId: req.params.id});
      })
      .then(channels => {
        const queryTasks = [];

        if (channels && channels.length) {
          channels.forEach(item => {
            deleteTasks.push(channelModel.delete(item.id));

            queryTasks.push(messageModel.query({channelId: item.id}));
          })
        }

        return Promise.all(queryTasks);
      })
      .then(results => {
        if (results && results.length) {
          results.forEach(messages => {
            if (messages && messages.length) {
              messages.forEach(item => {
                deleteTasks.push(messageModel.delete(item.id));
              })
            }
          })
        }

        return Promise.all(deleteTasks);
      })
      .then(dbResponses => {
        logUtils.fileLogDbErrors(dbResponses);

        return Promise.all(subSectionsUpdateTasks);
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
