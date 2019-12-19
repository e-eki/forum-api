'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const channelModel = require('../../mongoDB/models/channel');
const messageModel = require('../../mongoDB/models/message');
const channelUtils = require('../../utils/channelUtils');
const sectionModel = require('../../mongoDB/models/section');
const subSectionModel = require('../../mongoDB/models/subSection');

let router = express.Router();

//----- endpoint: /api/channel/
router.route('/channel')

  // получение всех каналов (для поиска по форуму)
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

  // создание нового канала
  .post(function(req, res) {
    const data = {
      name: req.body.name,
      description: req.body.description,
      senderId: req.body.senderId,
      subSectionId: req.body.subSectionId,
      descriptionMessageId: req.body.descriptionMessageId,
      //lastVisitDate: new Date(),  //?
    };

    return channelModel.create(data)
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

//----- endpoint: /api/channel/:id
router.route('/channel/:id')

  // получение канала по его id
  .get(function(req, res) {      
    return Promise.resolve(channelModel.query({id: req.params.id}))
      .then(results => {
        const channel = results[0];

        const tasks = [];

        tasks.push(channel);
        tasks.push(subSectionModel.query({id: channel.subSectionId}));

        return Promise.all(tasks);
      })
      .spread((channel, results) => {
        const tasks = [];
        tasks.push(channel);  //?

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

        return channelUtils.getMessagesDataForChannel(channel);
      })
      .then(channel => {
      //   const tasks = [];
      //   tasks.push(channel);

      //   //проставляем дату последнего просмотра канала
      //   channel.lastVisitDate = new Date();
      //   tasks.push(channelModel.update(channel.id, channel));

      //   return Promise.all(tasks);
      // })
      // .spread((channel, dbResponse) => {
        
        return utils.sendResponse(res, channel);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      });
  })

  .post(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

  // редактирование данных канала по его id
  .put(function(req, res) {
    const data = {
      name: req.body.name,
      description: req.body.description,
      senderId: req.body.senderId,
      subSectionId: req.body.subSectionId,
      descriptionMessageId: req.body.descriptionMessageId,
      //lastVisitDate: req.body.lastVisitDate,  //?
    };

    return channelModel.update(req.params.id, data)
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // удаление канала по его id
  .delete(function(req, res) {

    const deleteTasks = [];

    deleteTasks.push(channelModel.delete(req.params.id));

    return messageModel.query({channelId: req.params.id})
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
