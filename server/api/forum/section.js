'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const sectionModel = require('../../mongoDB/models/section');
const subSectionModel = require('../../mongoDB/models/subSection');
const channelModel = require('../../mongoDB/models/channel');
const messageModel = require('../../mongoDB/models/message');
const rightsUtils = require('../../utils/rigthsUtils');
const errors = require('../../utils/errors');

let router = express.Router();

//----- endpoint: /api/forum/section/
router.route('/section')

  // получение всех разделов
  .get(function(req, res) { 
    let data = null;

    return Promise.resolve(sectionModel.query())
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
      .then((subSections) => {

        if (data && data.length &&
            subSections && subSections.length) {
              for (let i = 0; i < subSections.length; i++) {
                data[i].subSections = subSections[i] || [];
              }
        }

        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // создание нового раздела
  .post(function(req, res) {
    const data = {
      name: req.body.name,
      description: req.body.description,
      senderId: req.body.senderId,
      orderNumber: req.body.orderNumber,
    };

    return sectionModel.create(data)
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

//----- endpoint: /api/forum/section/:id
router.route('/section/:id')

  // получение раздела по его id
  .get(function(req, res) {      
    return Promise.resolve(sectionModel.query({id: req.params.id}))   //({_id: req.params.id})
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
  .put(function(req, res) {
    const data = {
      name: req.body.name,
      description: req.body.description,
      senderId: req.body.senderId,
      orderNumber: req.body.orderNumber,
    };

    return sectionModel.update(req.params.id, data)
      .then(dbResponse => {
        utils.logDbErrors(dbResponse);

        return utils.sendResponse(res, dbResponse, 201);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // удаление раздела по его id
  .delete(function(req, res) {
    const sectionId = req.params.id;

    const sectionsUpdateTasks = [];
    const deleteTasks = [];

    return sectionModel.query()
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
        utils.logDbErrors(dbResponses);

        return Promise.all(sectionsUpdateTasks);
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
