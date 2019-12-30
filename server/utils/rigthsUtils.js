'use strict';

const Promise = require('bluebird');
const config = require('../config');

const rightsUtils = new function() {

	// базовая проверка прав юзера
	this.isRightsValid = function(user) {
		// юзер в ЧС не может совершать никаких действий
		return (!user.inBlackList);
	};

	//---- user

	// есть ли права у юзера изменить внесение в ЧС
	this.isRightsValidForBlackList = function(user) {
		// изменить внесение кого-либо в ЧС могут админ и модератор
        return (user.role === config.userRoles.admin || user.role === config.userRoles.moderator);
	};

	// есть ли права у юзера изменить роль
	this.isRightsValidForRole = function(user) {
		// изменить роль может админ
        return (user.role === config.userRoles.admin);
	};

	//---- channel

	// есть ли права у юзера удалить чат
	this.isRightsValidForDeleteChannel = function(user) {
		// удалить чат могут админ и модератор
        return (user.role === config.userRoles.admin || user.role === config.userRoles.moderator);
	};

	//---- section

	// есть ли права у юзера добавить/изменить/удалить раздел
	this.isRightsValidForSection = function(user) {
        return (user.role === config.userRoles.admin);
	};

	//---- subSection

	// есть ли права у юзера добавить/изменить/удалить подраздел
	this.isRightsValidForSubSection = function(user) {
        return (user.role === config.userRoles.admin);
	};
};

module.exports = rightsUtils;