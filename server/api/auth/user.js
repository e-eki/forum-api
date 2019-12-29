'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const userModel = require('../../mongoDB/models/user');
const userInfoModel = require('../../mongoDB/models/userInfo');
const userVisitDataModel = require('../../mongoDB/models/userVisitData');
const tokenUtils = require('../../utils/tokenUtils');
const config = require('../../config');
const errors = require('../../utils/errors');
const rightsUtils = require('../../utils/rigthsUtils');

let router = express.Router();

//----- endpoint: /api/auth/user/
router.route('/user')

  .get(function(req, res) { 
    return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
  })

  // метод не поддерживается - юзер может быть добавлен только через регистрацию
  .post(function(req, res) {
    return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
  })
  
  .put(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
  })
  
  .delete(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})
;

//----- endpoint: /api/auth/user/:id
router.route('/user/:id')

  // получение юзера по его id
  .get(function(req, res) {      
    return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
  })

  .post(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

  // редактирование данных юзера по его id
  .put(function(req, res) {
    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(user => {
        // проверяем права
        if (!rightsUtils.isRightsValid(user) ||
            (req.body.inBlackList && !rightsUtils.isRightsValidForBlackList(user)) ||
            (req.body.role && !rightsUtils.isRightsValidForRole(user))) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }
        
        const data = {
          role: req.body.role,
          inBlackList: req.body.inBlackList,
        };

        return userModel.update(req.params.id, data);
      })
      .then(dbResponse => {
        utils.logDbErrors(dbResponse);

        return utils.sendResponse(res, 'user updated successfully', 201);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error);
      });
  })

  // метод не поддерживается - удалить юзера нельзя (можно внести в ЧС)
  .delete(function(req, res) {
    return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);

    // const userId = req.params.id;
    // const tasks = [];

    // tasks.push(userModel.delete(userId));
    // tasks.push(userInfo.delete(userId));
    // tasks.push(userVisitDataModel.delete(userId));

    // return Promise.all(tasks)
    //   .then((data) => {
    //     return utils.sendResponse(res, data);
    //   })
    //   .catch((error) => {
    //     return utils.sendErrorResponse(res, error, 500);
    //   })
  })
;

module.exports = router;
