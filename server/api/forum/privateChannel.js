'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const privateChannelModel = require('../../mongoDB/models/privateChannel');
const messageModel = require('../../mongoDB/models/message');
const channelUtils = require('../../utils/channelUtils');
const rightsUtils = require('../../utils/rigthsUtils');
const errors = require('../../utils/errors');

let router = express.Router();

//----- endpoint: /api/forum/private-channel/
router.route('/private-channel')

  /*data = {
		recipientId
	}*/
  .get(function(req, res) {
    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(user => {
        const config = {
          userId: user.id,
        };

        if (req.query.recipientId) {
          config.recipientId = req.query.recipientId;
        }

        return Promise.resolve(privateChannelModel.query(config));
      })
      .then(privateChannels => {
        const tasks = [];

        if (privateChannels && privateChannels.length) {
          //если ищем чат по id получателя - то это будет один приватный чат (текущий)
          if (req.query.recipientId) {
            const privateChannel = privateChannels[0];

            tasks.push(channelUtils.getNameForPrivateChannel(privateChannel, userId));
          }
          // иначе это список приватных чатов
          else {
            tasks.push(channelUtils.getNamesForPrivateChannels(privateChannels, userId));
          }
        }
        else {
          tasks.push(false);
        }
        
        return Promise.all(tasks);
      })
      .spread(privateChannels => {
        const tasks = [];

        if (privateChannels && privateChannels.length) {
          if (req.query.recipientId) {
            const privateChannel = privateChannels[0];

            tasks.push(channelUtils.getMessagesDataForChannel(privateChannel));
          }
          else {
            tasks.push(channelUtils.getMessagesDataForChannels(privateChannels));
          }
        }
        else {
          tasks.push(false);
        }
        
        return Promise.all(tasks);
      })
      .spread(privateChannels => {
        let result;

        if (privateChannels && privateChannels.length && (privateChannels.length > 1)) {
          result = channelUtils.sortChannelsByLastMessageDate(privateChannels);
        }
        else {
          result = privateChannels || [];
        }

        return utils.sendResponse(res, result);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      });
  })

  // создание нового приватного чата
  /*data = {
		recipientId
	}*/
  .post(function(req, res) {
    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(user => {
        // проверяем права
        if (!rightsUtils.isRightsValid(user)) {
          throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const data = {
          recipientId: req.body.recipientId,
          senderId: user.id
          //lastVisitDate: new Date(),  //?
        };

        return privateChannelModel.create(data);
      })
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

//----- endpoint: /api/forum/private-channel/:id
router.route('/private-channel/:id')

  // получение приватного чата по его id
  .get(function(req, res) { 
    const userId = '5dd6d4c6d0412d25e4895fad'; //todo

    return Promise.resolve(privateChannelModel.query({id: req.params.id}))
      .then(results => {
        if (results && results.length) {
          const privateChannel = results[0];

          return channelUtils.getNameForPrivateChannel(privateChannel, userId);
        }
        else {
          return false;
        }
      })
      .then(privateChannel => {
        if (privateChannel) {
          return channelUtils.getMessagesDataForChannel(privateChannel);
        }
        else {
          return false;
        }
      })
      .then((privateChannel) => {
      //   const tasks = [];
      //   tasks.push(privateChannel);

      //   if (privateChannel) {
      //     privateChannel.lastVisitDate = new Date();
      //     tasks.push(privateChannelModel.update(privateChannel.id, privateChannel));
      //   }

      //   return Promise.all(tasks);
      // })
      // .spread((privateChannel, dbResponse) => {
        return utils.sendResponse(res, privateChannel);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      });
  })

  .post(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

  // редактирование данных приватного чата по его id
  .put(function(req, res) {
    const data = {
      senderId: req.body.senderId,
      descriptionMessageId: req.body.descriptionMessageId,
      //lastVisitDate: req.body.lastVisitDate,  //?
    };

    return privateChannelModel.update(req.params.id, data)
      .then(dbResponse => {
        utils.logDbErrors(dbResponse);

        return utils.sendResponse(res, 201);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // удаление приватного чата по его id
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
        utils.logDbErrors(dbResponse);
        
        return utils.sendResponse(res);  //??data
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error, 500);
      })
  })
;

module.exports = router;
