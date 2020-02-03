'use strict';

const express = require('express');
const Promise = require('bluebird');
const ObjectId = require('mongoose').Types.ObjectId;
const utils = require('../../utils/baseUtils');
const logUtils = require('../../utils/logUtils');
const userModel = require('../../mongoDB/models/user');
const userInfoModel = require('../../mongoDB/models/userInfo');
const rightsUtils = require('../../utils/rightsUtils');
const tokenUtils = require('../../utils/tokenUtils');
const errors = require('../../utils/errors');
const responses = require('../../utils/responses');
const config = require('../../config');

let router = express.Router();

//----- endpoint: /api/forum/user-info/
router.route('/user-info')

  // получение информации о юзере по его аксесс токену
  .get(function(req, res) {
    let user = null;

    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(result => {
        user = result;

        // проверяем права
        if (!user ||
            !rightsUtils.isRightsValid(user)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        return userInfoModel.query({userId: user.id});
      })
      .then(results => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const userInfo = results[0];

        //get rights
        const canEditRole = rightsUtils.isRightsValidForRole(user);
        const canEditBlackList = rightsUtils.isRightsValidForBlackList(user);
        const canEdit = rightsUtils.isRightsValidForEditUserInfo(user, userInfo);

        userInfo.canEditRole = canEditRole;
        userInfo.canEditBlackList = canEditBlackList;
        userInfo.canEdit = canEdit;

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
    let user = null;

    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
        return tokenUtils.checkAccessTokenAndGetUser(accessToken)
          .catch(error => {
            return null;
          })
      })
      .then(result => {
        user = result;

        // проверяем права
        // if (!rightsUtils.isRightsValid(user)) {
        //   throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        // }

        return userInfoModel.query({id: req.params.id});
      })
      .then(results => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN, 'No user with this id');
        }

        const userInfo = results[0];

        //get rights
        const canEditRole = rightsUtils.isRightsValidForRole(user);
        const canEditBlackList = rightsUtils.isRightsValidForBlackList(user);
        const addPrivateChannelRights = rightsUtils.isRightsValidForAddPrivateChannel(user);

        userInfo.canEditRole = canEditRole;
        userInfo.canEditBlackList = canEditBlackList;
        userInfo.canAddPrivateChannel = addPrivateChannelRights;

        const tasks = [];
        tasks.push(userInfo);

        tasks.push(userModel.query({id: userInfo.userId}));

        return Promise.all(tasks);
      })
      .spread((userInfo, user) => {
        userInfo.role = user.role;
        userInfo.inBlackList = user.inBlackList;

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
    captionText,
    role,
    inBlackList
	}*/
  .put(function(req, res) {
    let canEditRole;
    let canEditBlackList;

    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(user => {
        // проверяем права
        if (!user ||
            !rightsUtils.isRightsValid(user) ||
            (new ObjectId(user.id) !== new ObjectId(req.params.id))) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        canEditRole = rightsUtils.isRightsValidForRole(user);
        canEditBlackList = rightsUtils.isRightsValidForBlackList(user);

        if (canEditRole || canEditBlackList) {
          return userInfoModel.query({id: req.params.id});
        }
        else {
          return false;
        }
      })
      .then(results => {
        if (!results || !results.length) {
          return false;
        }
        else {
          const userInfo = results[0];

          return userModel.query({id: userInfo.userId});
        }
      })
      .then(results => {
        const tasks = [];

        if (results && results.length) {
          const user = results[0];

          const userData = {
            role: (canEditRole ? req.body.role : null),
            inBlackList: (canEditBlackList ? req.body.inBlackList : null),
          };

          tasks.push(userModel.update(user.id, userData));
        }
        else {
          tasks.push(false);
        }

        const userInfoData = {
          name: req.body.name,
          birthDate: req.body.birthDate,
          city: req.body.city,
          profession: req.body.profession,
          hobby: req.body.hobby,
          captionText: req.body.captionText,
        };

        tasks.push(userInfoModel.update(req.params.id, userInfoData));

        return Promise.all(tasks);
      })
      .then(dbResponses => {
        logUtils.fileLogDbErrors(dbResponses);

        return utils.sendResponse(res, null, responses.CREATED_RESPONSE.status);
      })
      .catch((error) => {
        return utils.sendErrorResponse(res, error);
      });
  })

  // удаление информации юзера по его id - todo??
  .delete(function(req, res) {
    return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
  })
;

module.exports = router;
