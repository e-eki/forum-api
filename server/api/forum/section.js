'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const logUtils = require('../../utils/logUtils');
const sectionModel = require('../../mongoDB/models/section');
const subSectionModel = require('../../mongoDB/models/subSection');
const channelModel = require('../../mongoDB/models/channel');
const messageModel = require('../../mongoDB/models/message');
const rightsUtils = require('../../utils/rightsUtils');
const tokenUtils = require('../../utils/tokenUtils');
const errors = require('../../utils/errors');
const responses = require('../../utils/responses');

let router = express.Router();

//----- endpoint: /api/forum/section/
router.route('/section')

  // получение всех разделов
  .get(function(req, res) { 
    let data = null;
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
      .then(user => {
        user = user;

        return Promise.resolve(sectionModel.query());
      })
      .then((sections) => {
        data = sections;

        const tasks = [];

        if (sections && sections.length) {
          sections.forEach(item => {
            tasks.push(subSectionModel.query({sectionId: item.id}));
          })
        }

        return Promise.all(tasks);
      })
      .then(subSections => {
        if (data && data.length &&
            subSections && subSections.length) {
              for (let i = 0; i < subSections.length; i++) {
                data[i].subSections = subSections[i] || [];
              }
        }

        //get rights
        const sectionRights = user ? rightsUtils.isRightsValidForSection(user) : false;
        const subSectionRights = user ? rightsUtils.isRightsValidForSubSection(user) : false;

        data.canAdd = sectionRights;

        data.forEach(section => {
          section.canEdit = section.canDelete = sectionRights;
          section.canAdd = sectionRights;

          section.subSections.forEach(subSection => {
            subSection.canEdit = subSection.canDelete = subSectionRights;
          })
        })

        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error);
      });
  })

  // создание нового раздела
  /*data = {
		name,
    description,
    orderNumber
	}*/
  .post(function(req, res) {
    return Promise.resolve(true)
			.then(() => {
        const validationErrors = [];

				//validate req.body
				if (!req.body.name || req.body.name == '') {
					validationErrors.push('empty name');
				}
				if (!req.body.orderNumber || req.body.orderNumber == '') {
					validationErrors.push('empty orderNumber');
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
        if (!rightsUtils.isRightsValid(user) ||
            !rightsUtils.isRightsValidForSection(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const data = {
          name: req.body.name,
          description: req.body.description,
          senderId: user.id,
          orderNumber: req.body.orderNumber,
        };

        return sectionModel.create(data);
      })
      .then(dbResponse => {
        logUtils.consoleLogDbErrors(dbResponse);

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

//----- endpoint: /api/forum/section/:id
router.route('/section/:id')

  // получение раздела по его id
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
      .then(user => {
        user = user;

        return Promise.resolve(sectionModel.query({id: req.params.id}));
      })
      .then(results => {
        const section = results[0];
        const tasks = [];

        tasks.push(section);
        tasks.push(subSectionModel.query({sectionId: section.id}));

        return Promise.all(tasks);
      })
      .spread((section, subSections) => {
        let data = section;
        data.subSections = subSections;

        //get rights
        const sectionRights = user ? rightsUtils.isRightsValidForSection(user) : false;
        const subSectionRights = user ? rightsUtils.isRightsValidForSubSection(user) : false;

        data.canEdit = data.canDelete = sectionRights;
        data.canAdd = subSectionRights;

        data.subSections.forEach(subSection => {
          subSection.canEdit = subSection.canDelete = subSectionRights;
        })

        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
  })

  .post(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

  // редактирование данных раздела по его id
  /*data = {
		name,
    description,
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
        if (!rightsUtils.isRightsValid(user) ||
            !rightsUtils.isRightsValidForSection(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const data = {
          name: req.body.name,
          description: req.body.description,
          senderId: user.id,  //todo? updaterId
          orderNumber: req.body.orderNumber,
        };

        return sectionModel.update(req.params.id, data);
      })
      .then(dbResponse => {
        logUtils.consoleLogDbErrors(dbResponse);

        return utils.sendResponse(res, null, responses.CREATED_RESPONSE.status);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error);
      });
  })

  // удаление раздела по его id
  .delete(function(req, res) {
    const sectionId = req.params.id;

    const sectionsUpdateTasks = [];
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
        if (!rightsUtils.isRightsValid(user) ||
            !rightsUtils.isRightsValidForSection(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        return sectionModel.query();
      })
      .then(sections => {
        // корректируем номер порядка у всех элементов, следующих за удаляемым
        if (sections && sections.length) {
          const section = sections.find(item => item.id.toString() === sectionId);

          sections.forEach(item => {
            if (item.orderNumber > section.orderNumber) {
              item.orderNumber--;

              sectionsUpdateTasks.push(sectionModel.update(item.id, item));
            }
          })
        }

        deleteTasks.push(sectionModel.delete(sectionId));

        return subSectionModel.query({sectionId: sectionId});
      })
      .then(subSections => {
        const queryTasks = [];

        if (subSections && subSections.length) {
          subSections.forEach(item => {
            deleteTasks.push(subSectionModel.delete(item.id));

            queryTasks.push(channelModel.query({subSectionId: item.id}));
          })
        }

        return Promise.all(queryTasks);
      })
      .then(results => {
        const queryTasks = [];

        if (results && results.length) {
          results.forEach(channels => {
            if (channels && channels.length) {
              channels.forEach(item => {
                channels.forEach(item => {
                  deleteTasks.push(channelModel.delete(item.id));
      
                  queryTasks.push(messageModel.query({channelId: item.id}));
                })
              })
            }
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
        logUtils.consoleLogDbErrors(dbResponses);

        return Promise.all(sectionsUpdateTasks);
      })
      .then(dbResponses => {
        logUtils.consoleLogDbErrors(dbResponses);

        return utils.sendResponse(res);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      })
  })
;

module.exports = router;
