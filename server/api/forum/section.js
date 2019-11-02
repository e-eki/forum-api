'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../lib/utils');
const sectionModel = require('../models/section');

let router = express.Router();

//----- endpoint: /api/section/
router.route('/section')

  // получение всех разделов
  .get(function(req, res) { 
    return sectionModel.query()
      .then((sections) => {

        // sections.map(item => {  
        //   item.id = item._id;
        //   delete item._id;
        // })

        return utils.sendResponse(res, sections);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // создание нового раздела
  .post(function(req, res) {
    const sectionData = {
      name: req.body.name,
			description: req.body.description,
    }

    return sectionModel.create(sectionData)
      .then((dbResponse) => {
				if (dbResponse.errors) {
					utils.logDbErrors(dbResponse.errors);

					// ? если в БД не удалось сохранить игру - то ошибка, надо повторить всё сначала
					throw utils.initError('INTERNAL_SERVER_ERROR', 'game error');
				}

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
router.route('/section/:id')

  // получение раздела по его id
  .get(function(req, res) {      
    return sectionModel.query(req.params.id)   //({_id: req.params.id})
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

  // редактирование данных раздела по его id
  .put(function(req, res) {
    const section = null; //?

    return sectionModel.update(req.params.id, req.body)
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // удаление раздела по его id
  .delete(function(req, res) {
    return sectionModel.delete(req.params.id)
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error, 500);
      })
  })
;

module.exports = router;
