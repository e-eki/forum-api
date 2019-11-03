'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../lib/utils');
const channelModel = require('../../mongoDB/models/channel');

let router = express.Router();

//----- endpoint: /api/channel/
router.route('/channel')

  // получение всех каналов
  .get(function(req, res) { 
    return channelModel.query()
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // создание нового канала
  .post(function(req, res) {
    const data = {
      name: req.body.name,
      description: req.body.description,
      //senderId: req.body.senderId,
      //subSectionId: req.body.subSectionId,
			//descriptionMessageId: req.body.descriptionMessageId,
    }

    return channelModel.create(data)
      .then((dbResponse) => {
				return utils.sendResponse(res, 'section successfully saved', 201);
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
    return channelModel.query({id: req.params.id})
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

  // редактирование данных канала по его id
  .put(function(req, res) {
    const data = {
      name: req.body.name,
      description: req.body.description,
      //senderId: req.body.senderId,
      //subSectionId: req.body.subSectionId,
			//descriptionMessageId: req.body.descriptionMessageId,
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
    return channelModel.delete(req.params.id)
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error, 500);
      })
  })
;

module.exports = router;
