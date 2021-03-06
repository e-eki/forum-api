'use strict';

const express = require('express');
const Promise = require('bluebird');
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
        if (!user /*||
            !rightsUtils.isRightsValid(user)*/) {
              throw utils.initError(errors.FORBIDDEN/*, 'Недостаточно прав для совершения данного действия'*/);
        }

        return userInfoModel.query({userId: user.id});
      })
      .then(results => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        const userInfo = results[0];
        userInfo.role = user.role;
        userInfo.inBlackList = user.inBlackList;

        //get rights
        const canEditRole = rightsUtils.isRightsValidForRole(user);
        const canEditBlackList = rightsUtils.isRightsValidForBlackList(user, user);
        const canEdit = rightsUtils.isRightsValidForEditUserInfo(user, userInfo);

        // права управления личной информацией юзера для данного юзера
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
        const tasks = [];

        tasks.push(userModel.query({id: req.params.id}));
        tasks.push(userInfoModel.query({userId: req.params.id}));
        
        return Promise.all(tasks);
      })
      .spread((userResults, userInfoResults) => {
        if (!userResults.length || !userInfoResults.length) {
          throw utils.initError(errors.FORBIDDEN, 'No user with this id');
        }

        const userData = userResults[0];
        const userInfo = userInfoResults[0];

        userInfo.role = userData.role;
        userInfo.inBlackList = userData.inBlackList;

        //get rights
        const canEditRole = user ? rightsUtils.isRightsValidForRole(user) : false;
        const canEditBlackList = user ? rightsUtils.isRightsValidForBlackList(user, userData) : false;
        const addPrivateChannelRights = user ? rightsUtils.isRightsValidForAddPrivateChannel(user) : false;

        // права управления личной информацией юзера для данного юзера
        userInfo.canEditRole = canEditRole;
        userInfo.canEditBlackList = canEditBlackList;
        userInfo.canAddPrivateChannel = addPrivateChannelRights;
        
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
    const userInfoId = req.params.id;

    let canEditUserInfo;
    let canEditRole;
    let canEditBlackList;
    let user;
    let editableUser;
    let userInfo;

    return Promise.resolve(true)
			.then(() => {
				//get token from header
				const headerAuthorization = req.header('Authorization') || '';
				const accessToken = tokenUtils.getAccessTokenFromHeader(headerAuthorization);
				
				return tokenUtils.checkAccessTokenAndGetUser(accessToken);
			})
			.then(result => {
        user = result;

        return userInfoModel.query({id: userInfoId});
      })
      .then(results => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        userInfo = results[0];

        return userModel.query({id: userInfo.userId});
      })
      .then(results => {
        if (!results.length) {
          throw utils.initError(errors.FORBIDDEN);
        }

        editableUser = results[0];

        // проверяем права
        canEditUserInfo = rightsUtils.isRightsValidForEditUserInfo(user, userInfo);
        canEditRole = rightsUtils.isRightsValidForRole(user);
        canEditBlackList = rightsUtils.isRightsValidForBlackList(user, editableUser);

        if (!user ||
            (!canEditUserInfo && !canEditRole && !canEditBlackList)) {
              throw utils.initError(errors.FORBIDDEN, 'Недостаточно прав для совершения данного действия');
        }

        const tasks = [];

        if (canEditRole || canEditBlackList) {
          let userData = {};

          if (canEditRole && req.body.role) {
            userData.role = req.body.role;
            userData.editorId = user.id;
          }
          if (canEditBlackList) {
            userData.inBlackList = req.body.inBlackList;
            userData.editorId = user.id;
          }

          tasks.push(userModel.update(editableUser.id, userData));
        }
        else {
          tasks.push(false);
        }

        if (canEditUserInfo) {
          const userInfoData = {
            userId: userInfo.userId,
            name: req.body.name,
            birthDate: req.body.birthDate,
            city: req.body.city,
            profession: req.body.profession,
            hobby: req.body.hobby,
            captionText: req.body.captionText,
            editorId: user.id,
          };
  
          tasks.push(userInfoModel.update(userInfoId, userInfoData));
        }
        else {
          tasks.push(false);
        }

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
  // пока что удалить нельзя, ни юзера, ни его личную информацию - можно добавить в ЧС форума
  .delete(function(req, res) {
    return utils.sendErrorResponse(res, errors.UNSUPPORTED_METHOD);
  })
;

module.exports = router;
