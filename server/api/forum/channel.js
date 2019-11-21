'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../lib/utils');
const channelModel = require('../../mongoDB/models/channel');
const messageModel = require('../../mongoDB/models/message');

let router = express.Router();

//----- endpoint: /api/channel/
router.route('/channel')

  // получение всех каналов
  .get(function(req, res) { 
    // return channelModel.query()
    //   .then((data) => {
    //     return utils.sendResponse(res, data);
    //   })
    //   .catch((error) => {
		// 		return utils.sendErrorResponse(res, error, 500);
    //   });
    return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
  })

  // создание нового канала
  .post(function(req, res) {
    const data = {
      name: req.body.name,
      description: req.body.description,
      //senderId: req.body.senderId,
      subSectionId: req.body.subSectionId,
			descriptionMessageId: req.body.descriptionMessageId,
    }

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
        tasks.push(messageModel.query({channelId: channel.id}));

        return Promise.all(tasks);
      })
      .spread((channel, messages) => {
        let data = channel;
        data.messages = messages;

        return utils.sendResponse(res, data);
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
      //senderId: req.body.senderId,
      subSectionId: req.body.subSectionId,
			descriptionMessageId: req.body.descriptionMessageId,
    }

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
