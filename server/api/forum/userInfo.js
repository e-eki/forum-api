'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const userInfoModel = require('../../mongoDB/models/userInfo');
const ObjectId = require('mongoose').Types.ObjectId;
const rightsUtils = require('../../utils/rigthsUtils');

let router = express.Router();

//----- endpoint: /api/forum/user-info/
router.route('/user-info')

  // метод не поддерживается - информация о юзере доступна только по id
  .get(function(req, res) { 
    return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
  })

  // метод не поддерживается - todo???
  .post(function(req, res) {
    return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
  })
  
  .put(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
  })
  
  .delete(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})
;

//----- endpoint: /api/forum/user-info/:id
router.route('/user-info/:id')

  // получение информации о юзере по его id - todo???
  .get(function(req, res) {      
    return userInfoModel.query({id: req.params.id})
      .then((data) => {
        data = {
          id: new ObjectId(req.params.id),  //todo!
          login: 'VASYA',
          // 	name: { type: String },
          birthDate: new Date(),
          city: 'Moscow',
          // 	profession: { type: String },
          // 	hobby: { type: String },
          captionText: 'All you need is love',
        };

        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
  })

  .post(function(req, res) {
		return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
	})

  // редактирование информации юзера по его id - todo??
  .put(function(req, res) {
    return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
  })

  // удаление информации юзера по его id - todo??
  .delete(function(req, res) {
    return utils.sendErrorResponse(res, 'UNSUPPORTED_METHOD');
  })
;

module.exports = router;
