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

  .get(function(req, res) { 

    return Promise.resolve(privateChannelModel.query({recipientId: req.query.recipientId}))
      .then(results => {

        let privateChannel;
        // if (results && results.length) {
        //   privateChannel = results.find(item => {
        //     ((item.senderId === userId) || (item.recepientId === userId));   //todo!userId
        //   })
        // };

        privateChannel = (results && results.length) ? results[0] : null;

        const tasks = [];

        if (!privateChannel) {
          tasks.push(false);
        }
        else {
          tasks.push(privateChannel);
          tasks.push(messageModel.query({channelId: privateChannel.id}));
        }

        // const recipientId = (privateChannel.senderId !== req.params.id) ? privateChannel.senderId : privateChannel.recipientId;
        // tasks.push(userInfoModel.query({id: recipientId}));  //??

        return Promise.all(tasks);
      })
      .spread((privateChannel, messages, recepientUserInfo) => {

        if (privateChannel) {
          privateChannel.messages = messages;

          //privateChannel.name = recepientUserInfo.nickName;  //todo!!
          privateChannel.name = 'ALICE-PRIVATE';
        }

        return utils.sendResponse(res, privateChannel);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      });
  })

  // создание нового приватного канала
  .post(function(req, res) {
    const data = {
      recipientId: req.body.recipientId,
			senderId: req.body.recipientId,    //todo: senderId!!
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

        // const recipientId = (privateChannel.senderId !== req.params.id) ? privateChannel.senderId : privateChannel.recipientId;
        // tasks.push(userInfoModel.query({id: recipientId}));  //??

        return Promise.all(tasks);
      })
      .spread((privateChannel, messages, recepientUserInfo) => {
        privateChannel.messages = messages;

        //privateChannel.name = recepientUserInfo.nickName;  //todo!!
        privateChannel.name = 'ALICE';

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
