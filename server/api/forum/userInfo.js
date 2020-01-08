'use strict';

const express = require('express');
const Promise = require('bluebird');
const utils = require('../../utils/baseUtils');
const userInfoModel = require('../../mongoDB/models/userInfo');
const rightsUtils = require('../../utils/rigthsUtils');
const tokenUtils = require('../../utils/tokenUtils');
const errors = require('../../utils/errors');
const config = require('../../config');

let router = express.Router();

//----- endpoint: /api/forum/user-info/
router.route('/user-info')

  // получение информации о юзере по его аксесс токену
  .get(function(req, res) { 
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

        return userInfoModel.query({userId: user.id});
      })
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

        const tasks = [];

        const shownForManageRole = ((user.role === config.userRoles.admin) || 
                                    (user.role === config.userRoles.moderator));

        tasks.push(shownForManageRole);

        tasks.push(userInfoModel.query({id: req.params.id}));

        return Promise.all(tasks);
      })
      .spread((shownForManageRole, results) => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const userInfo = results[0];
        userInfo.shownForManageRole = shownForManageRole;

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
