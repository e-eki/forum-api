'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const userModel = require('../../mongoDB/models/user');

let router = express.Router();

//----- endpoint: /api/user/
router.route('/user')

  // получение всех юзеров  //todo - ограничения??
  .get(function(req, res) { 
    return userModel.query()
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // метод не поддерживается - юзер может быть добавлен только через регистрацию
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

//----- endpoint: /api/user/:id
router.route('/user/:id')

  // получение юзера по его id
  .get(function(req, res) {      
    return userModel.query({id: req.params.id})
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

  // редактирование данных юзера по его id
  .put(function(req, res) {
    const data = {
			email: req.body.email,
			confirmEmailCode: req.body.confirmEmailCode,
			isEmailConfirmed: req.body.isEmailConfirmed,
			password: req.body.password,
			resetPasswordCode: req.body.resetPasswordCode,
			role: req.body.role,
    }

    return userModel.update(req.params.id, data)
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error, 500);
      });
  })

  // удаление юзера по его id
  .delete(function(req, res) {
    return userModel.delete(req.params.id)
      .then((data) => {
        return utils.sendResponse(res, data);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error, 500);
      })
  })
;

module.exports = router;
