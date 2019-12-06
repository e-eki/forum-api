'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../lib/utils');
const privateChannelModel = require('../../mongoDB/models/privateChannel');
const messageModel = require('../../mongoDB/models/message');
const userInfoModel = require('../../mongoDB/models/userInfo');

let router = express.Router();

//----- endpoint: /api/private-channel/
router.route('/private-channel')

//todo - lastmessage!
  .get(function(req, res) { 

    const userId = '5dd6d4c6d0412d25e4895fad'; //todo
    let config = {};

    if (userId && req.query.recipientId) {
      config = {
        recipientId: req.query.recipientId,
        userId: userId,
      };
    }
    else if (userId) {
      config = {
        userId: userId,
      };
    }

    return Promise.resolve(privateChannelModel.query(config))
      .then(results => {
        const tasks = [];

        if (!req.query.recipientId) {
          tasks.push(results);
        }
        else {
          if (results && results.length) {
            const privateChannel = results[0];

            tasks.push(privateChannel);
            tasks.push(messageModel.query({channelId: privateChannel.id}));
          }
          else {
            tasks.push(false);
          }
        }

        return Promise.all(tasks)
      })
      .spread((result, messages) => {
        const tasks = [];

        tasks.push(result);

        if (result && req.query.recipientId) {
          result.messages = messages;
        }

        return utils.sendResponse(res, result);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      });
  })

  // создание нового приватного канала
  .post(function(req, res) {
    const data = {
      recipientId: req.body.recipientId,
      senderId: req.body.senderId,    //todo: senderId!!
      name: req.body.name,
    };

    return privateChannelModel.create(data)
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

//----- endpoint: /api/private-channel/:id
router.route('/private-channel/:id')

  // получение приватного канала по его id
  .get(function(req, res) {      
    return Promise.resolve(privateChannelModel.query({id: req.params.id}))
      .then(results => {
        const privateChannel = results[0];
        const tasks = [];

        tasks.push(privateChannel);
        tasks.push(messageModel.query({channelId: privateChannel.id}));

        return Promise.all(tasks);
      })
      .spread((privateChannel, messages) => {
        privateChannel.messages = messages;

        return utils.sendResponse(res, privateChannel);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      });
  })

  .post(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

  // редактирование данных приватного канала по его id
  .put(function(req, res) {
    const data = {
      descriptionMessageId: req.body.descriptionMessageId,
      name: req.body.name,
    };

    return privateChannelModel.update(req.params.id, data)
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // удаление приватного канала по его id
  .delete(function(req, res) {

    const deleteTasks = [];

    deleteTasks.push(privateChannelModel.delete(req.params.id));

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
