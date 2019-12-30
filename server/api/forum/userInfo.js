'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const userInfoModel = require('../../mongoDB/models/userInfo');
const rightsUtils = require('../../utils/rigthsUtils');
const errors = require('../../utils/errors');

let router = express.Router();

//----- endpoint: /api/forum/user-info/
router.route('/user-info')

  .get(function(req, res) { 
    return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
  })

  // userInfo создается вместе с user при регистрации
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

//----- endpoint: /api/forum/user-info/:id
router.route('/user-info/:id')

  // получение информации о юзере по его id
  .get(function(req, res) {      
    return userInfoModel.query({id: req.params.id})
      .then(results => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const userInfo = results[0];

        return utils.sendResponse(res, userInfo);
      })
      .catch((error) => {
				return utils.sendErrorResponse(res, error);
			});
  })

  .post(function(req, res) {
		return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
	})

  // редактирование информации юзера по его id
  /*data = {
		login,
    name,
    birthDate,
    city,
    profession,
    hobby,
    captionText
	}*/
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
            (user.id !== req.params.id)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const data = {
          login: req.body.login,
          name: req.body.name,
          birthDate: req.body.birthDate,
          city: req.body.city,
          profession: req.body.profession,
          hobby: req.body.hobby,
          captionText: req.body.captionText,
        };

        return userInfoModel.update(req.params.id, data);
      })
      .then(dbResponse => {
        utils.logDbErrors(dbResponse);

        return utils.sendResponse(res, dbResponse, 201);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error, 500);
      });
  })

  // удаление информации юзера по его id - todo??
  .delete(function(req, res) {
    return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
  })
;

module.exports = router;
