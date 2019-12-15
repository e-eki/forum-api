'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../lib/utils');
const subSectionModel = require('../../mongoDB/models/subSection');
const channelModel = require('../../mongoDB/models/channel');
const messageModel = require('../../mongoDB/models/message');
const channelUtils = require('../../lib/channelUtils');

let router = express.Router();

//----- endpoint: /api/subsection/
router.route('/subsection')

  // получение всех подразделов
  .get(function(req, res) { 
    // return subSectionModel.query()
    //   .then((data) => {
    //     return utils.sendResponse(res, data);
    //   })
    //   .catch((error) => {
		// 		return utils.sendErrorResponse(res, error, 500);
    //   });
    return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
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

//----- endpoint: /api/section/:id
router.route('/subsection/:id')

  // получение подраздела по его id
  .get(function(req, res) {      
    return Promise.resolve(subSectionModel.query({id: req.params.id}))
      .then(results => {
        const subSection = results[0];
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
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
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
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // удаление подраздела по его id
  .delete(function(req, res) {

    const deleteTasks = [];

    deleteTasks.push(subSectionModel.delete(req.params.id));

    return channelModel.query({subSectionId: req.params.id})
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
      .then(messages => {

        if (messages && messages.length) {
          messages.forEach(item => {
            deleteTasks.push(messageModel.delete(item.id));
          })
        }

        return Promise.all(deleteTasks);
      })
      .then((dbResponse) => {
        return utils.sendResponse(res);  //??data
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error, 500);
      })
  })
;

module.exports = router;
