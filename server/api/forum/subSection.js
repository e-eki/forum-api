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

  // получение всех подразделов (для списка родительских элементов для перемещения чата)
  .get(function(req, res) { 
    // let user = null;

    return Promise.resolve(true)
      .then(() => {
        //get token from header
			// 	const headerAuthorization = req.header('Authorization') || '';
			// 	const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
      //   return tokenUtils.checkAccessTokenAndGetUser(accessToken)
      //     .catch(error => {
      //       return null;
      //     })
      // })
      // .then(result => {
      //   user = result;

        return subSectionModel.query();
      })
      .then(subSections => {
        const result = subSections || [];

        //get rights
        // const subSectionRights = user ? rightsUtils.isRightsValidForSubSection(user) : false;
        // const addChannelRights = user ? rightsUtils.isRightsValidForAddChannel(user) : false;

        // subSections.forEach(item => {
        //   item.canEdit = item.canMove = item.canDelete = subSectionRights;
        //   item.canAdd = addChannelRights;
        // })

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
            !rightsUtils.isRightsValidForSubSection(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        return Promise.resolve(subSectionModel.query({sectionId: req.body.sectionId}));
      })
      .then(results => {
        // номер в списке подразделов
        const orderNumber = results ? results.length : 0;

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
        const addChannelRights = user ? rightsUtils.isRightsValidForAddChannel(user) : false;
        const deleteChannelRights = user ? rightsUtils.isRightsValidForDeleteChannel(user) : false;

        // права управления подразделом для данного юзера
        subSection.canEdit = subSection.canMove = subSection.canDelete = subSectionRights;
        subSection.canAdd = addChannelRights;

        subSection.channels.forEach(channel => {
          // права управления чатом для данного юзера
          channel.canDelete = deleteChannelRights;
          channel.canEdit = user ? rightsUtils.isRightsValidForEditChannel(user, channel) : false;
          channel.canMove = user ? rightsUtils.isRightsValidForMoveChannel(user) : false;
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
    const subSectionId = req.params.id;
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

        // проверяем права
        if (!user ||
            !rightsUtils.isRightsValidForSubSection(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        return subSectionModel.query({id: subSectionId});
      })
      .then(results => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const subSection = results[0];

        const data = {
          name: req.body.name,
          description: req.body.description,
          senderId: subSection.senderId,
          editorId: user.id,
          sectionId: req.body.sectionId,
          orderNumber: req.body.orderNumber,
        };

        return subSectionModel.update(subSectionId, data);
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
            !rightsUtils.isRightsValidForSubSection(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        return subSectionModel.query({id: subSectionId});
      })
      .then(results => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const subSection = results[0];

        const tasks = [];
        tasks.push(subSection);
        tasks.push(subSectionModel.query({sectionId: subSection.sectionId}));

        return Promise.all(tasks);
      })
      .spread((subSection, subSections) => {
        // корректируем номер в списке у всех элементов, следующих за удаляемым
        if (subSections && subSections.length) {
          const nextSubSections = subSections.filter(item => item.orderNumber > subSection.orderNumber);

          if (nextSubSections.length) {
            nextSubSections.forEach(item => {
              item.orderNumber--;
              subSectionsUpdateTasks.push(subSectionModel.update(item.id, item));
            })
          }
        }

        deleteTasks.push(subSectionModel.delete(subSectionId));

        return channelModel.query({subSectionId: subSectionId});
      })
      .then(channels => {
        const queryTasks = [];

        // удаляем все чаты данного подраздела
        if (channels && channels.length) {
          channels.forEach(item => {
            deleteTasks.push(channelModel.delete(item.id));

            queryTasks.push(messageModel.query({channelId: item.id}));
          })
        }

        return Promise.all(queryTasks);
      })
      .then(results => {
        // удаляем все сообщения в чатах данного подраздела
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
