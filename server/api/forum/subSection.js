'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const subSectionModel = require('../../mongoDB/models/subSection');
const channelModel = require('../../mongoDB/models/channel');
const messageModel = require('../../mongoDB/models/message');
const channelUtils = require('../../utils/channelUtils');
const sectionModel = require('../../mongoDB/models/section');
const rightsUtils = require('../../utils/rigthsUtils');
const errors = require('../../utils/errors');

let router = express.Router();

//----- endpoint: /api/forum/subsection/
router.route('/subsection')

  // получение всех подразделов
  .get(function(req, res) { 
    return subSectionModel.query()
      .then(subSections => {
        const result = subSections || [];

        return utils.sendResponse(res, result);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      })
  })

  // создание нового подраздела
  .post(function(req, res) {
    const data = {
      name: req.body.name,
      description: req.body.description,
      senderId: req.body.senderId,
      sectionId: req.body.sectionId,
      orderNumber: req.body.orderNumber,
    };

    return subSectionModel.create(data)
      .then((dbResponse) => {
        utils.logDbErrors(dbResponse);

				const id = (dbResponse._doc && dbResponse._doc._id) ? dbResponse._doc._id.toString() : null;

				return utils.sendResponse(res, {text: 'successfully saved', id: id}, 201);
			})
			.catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
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
    return Promise.resolve(subSectionModel.query({id: req.params.id}))
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

        if (channels && channels.length) {
          // ищем кол-во новых сообщений и последнее сообщение в каждом чате - отображаются в подразделе
          tasks.push(channelUtils.getMessagesDataForChannels(channels));
        }
        else {
          tasks.push(false);
        }  

        return Promise.all(tasks);
      })
      .spread((subSection, channels) => {
        if (channels) {
          subSection.channels = channelUtils.sortChannelsByLastMessageDate(channels);
        }
        else {
          subSection.channels = [];
        }

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
  .put(function(req, res) {
    const data = {
      name: req.body.name,
      description: req.body.description,
      senderId: req.body.senderId,
      sectionId: req.body.sectionId,
      orderNumber: req.body.orderNumber,
    };

    return subSectionModel.update(req.params.id, data)
      .then(dbResponse => {
        utils.logDbErrors(dbResponse);

        return utils.sendResponse(res, dbResponse, 201);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // удаление подраздела по его id
  .delete(function(req, res) {
    const subSectionId = req.params.id;

    const subSectionsUpdateTasks = [];
    const deleteTasks = [];

    return subSectionModel.query()
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
        utils.logDbErrors(dbResponses);

        return Promise.all(subSectionsUpdateTasks);
      })
      .then(dbResponses => {
        utils.logDbErrors(dbResponses);

        return utils.sendResponse(res);  //??data
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error, 500);
      })
  })
;

module.exports = router;
