'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../lib/utils');
const channelModel = require('../../mongoDB/models/channel');
const messageModel = require('../../mongoDB/models/message');

let router = express.Router();

//----- endpoint: /api/message/
router.route('/message')

  // получение всех сообщений
  .get(function(req, res) { 
    // return messageModel.query()
    //   .then((data) => {
    //     return utils.sendResponse(res, data);
    //   })
    //   .catch((error) => {
		// 		return utils.sendErrorResponse(res, error, 500);
    //   });
    return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
  })

  // создание нового сообщения
  .post(function(req, res) {
    const data = {
      date: req.body.date,
			text: req.body.text,
			//senderId: req.body.senderId,
			//recipientId: req.body.recipientId,
			channelId: req.body.channelId,
    }

    return messageModel.create(data)
      .then((dbResponse) => {
				return utils.sendResponse(res, 'successfully saved', 201);
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

//----- endpoint: /api/message/:id
router.route('/message/:id')

  // получение сообщения по его id
  .get(function(req, res) {      
    return messageModel.query({id: req.params.id})
      .then((data) => {
        return utils.sendResponse(res, data);
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
    const data = {
      date: req.body.date,
			text: req.body.text,
			//senderId: req.body.senderId,
			//recipientId: req.body.recipientId,
			channelId: req.body.channelId,
    }

    return messageModel.update(req.params.id, data)
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // удаление сообщения по его id
  .delete(function(req, res) {

    const tasks = [];

    tasks.push(messageModel.delete(req.params.id));

    return channelModel.query({descriptionMessageId: req.params.id})
      .then(result => {

        if (result && result.length) {
          const channel = result[0];
          channel.descriptionMessageId = null;

          tasks.push(channelModel.update(channel.id, channel));
        }
        return Promise.all(tasks)
      })
      .then(dbResponses => {
        return utils.sendResponse(res);  //??data
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error, 500);
      })
  })
;

module.exports = router;
