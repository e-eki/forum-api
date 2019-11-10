'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../lib/utils');
const sectionModel = require('../../mongoDB/models/section');
const subSectionModel = require('../../mongoDB/models/subSection');

let router = express.Router();

//----- endpoint: /api/section/
router.route('/section')

  // получение всех разделов
  .get(function(req, res) { 
    return sectionModel.query()
      .then((data) => {
        // sections.map(item => {  
        //   item.id = item._id;
        //   delete item._id;
        // })

        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // создание нового раздела
  .post(function(req, res) {
    const data = {
      name: req.body.name,
      description: req.body.description,
      //senderId: req.body.senderId,
    }

    return sectionModel.create(data)
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
router.route('/section/:id')

  // получение раздела по его id
  .get(function(req, res) {      
    return Promise.resolve(sectionModel.query({id: req.params.id}))   //({_id: req.params.id})
      .then(results => {
        const section = results[0];
        const tasks = [];

        tasks.push(section);
        tasks.push(subSectionModel.query({sectionId: section.id}));

        return Promise.all(tasks);
      })
      .spread((section, subSections) => {
        let data = section;
        data.subSections = subSections;

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
    const data = {
      name: req.body.name,
      description: req.body.description,
      //senderId: req.body.senderId,
    }

    return sectionModel.update(req.params.id, data)
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
