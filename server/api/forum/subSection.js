'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../lib/utils');
const subSectionModel = require('../../mongoDB/models/subSection');

let router = express.Router();

//----- endpoint: /api/subsection/
router.route('/subsection')

  // получение всех подразделов
  .get(function(req, res) { 
    return subSectionModel.query()
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // создание нового подраздела
  .post(function(req, res) {
    const data = {
      name: req.body.name,
      description: req.body.description,
      //senderId: req.body.senderId,
      //sectionId: req.body.sectionId,
    }

    return subSectionModel.create(data)
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

//----- endpoint: /api/section/:id
router.route('/subsection/:id')

  // получение подраздела по его id
  .get(function(req, res) {      
    return subSectionModel.query({id: req.params.id})
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

  // редактирование данных подраздела по его id
  .put(function(req, res) {
    const data = {
      name: req.body.name,
      description: req.body.description,
      //senderId: req.body.senderId,
      //sectionId: req.body.sectionId,
    }

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
    return subSectionModel.delete(req.params.id)
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error, 500);
      })
  })
;

module.exports = router;
