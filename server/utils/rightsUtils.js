'use strict';

const Promise = require('bluebird');
const ObjectId = require('mongoose').Types.ObjectId;
const config = require('../config');

const rightsUtils = new function() {

	// базовая проверка прав
	this.isRightsValid = function(user) {
		// в ЧС не может совершать никаких действий
		return (!user.inBlackList);
	};

	//---- user

	// есть ли права изменить внесение в ЧС
	this.isRightsValidForBlackList = function(user) {
		// изменить внесение кого-либо в ЧС могут админ и модератор
		return (this.isRightsValid(user) && 
				(user.role === config.userRoles.admin || user.role === config.userRoles.moderator));
	};

	// есть ли права изменить роль
	this.isRightsValidForRole = function(user) {
		// изменить роль может админ
		return (this.isRightsValid(user) &&
				user.role === config.userRoles.admin);
	};

	// есть ли права изменить информацию о пользователе
	this.isRightsValidForEditUserInfo = function(user, userInfo) {
		// изменить информацию о пользователе может только сам пользователь
		return (this.isRightsValid(user) &&
				(user.id.toString() === userInfo.userId.toString()));  //??todo: как правильно сравнивать id?
	};

	//---- section

	// есть ли права добавить/изменить/удалить/переместить раздел
	this.isRightsValidForSection = function(user) {
		return (this.isRightsValid(user) &&
				user.role === config.userRoles.admin);
	};

	//---- subSection

	// есть ли права добавить/изменить/удалить/переместить подраздел
	this.isRightsValidForSubSection = function(user) {
		return (this.isRightsValid(user) &&
				user.role === config.userRoles.admin);
	};

	//---- channel

	// есть ли права добавить чат
	this.isRightsValidForAddChannel = function(user) {
		// добавить чат могут все
		return this.isRightsValid(user);
	};

	// есть ли права переместить чат
	this.isRightsValidForMoveChannel = function(user) {
		// переместить чат может админ (если это не личный чат!)
		return (this.isRightsValid(user) &&
				user.role === config.userRoles.admin);
	};

	// есть ли права удалить чат
	this.isRightsValidForDeleteChannel = function(user) {
		// удалить чат могут админ и модератор
		return (this.isRightsValid(user) &&
				(user.role === config.userRoles.admin ||
				user.role === config.userRoles.moderator));
	};

	// есть ли права редактировать чат
	this.isRightsValidForEditChannel = function(user, channel) {
		// редактировать чат могут админ и модератор и юзер, если чат создан им
		return (this.isRightsValid(user) &&
				(user.role === config.userRoles.admin ||
				user.role === config.userRoles.moderator ||
				user.id.toString() === channel.senderId.toString()));
	};

	//---- private-channel

	// есть ли права добавить личный чат
	this.isRightsValidForAddPrivateChannel = function(user) {
		// добавить личный чат могут все
		return this.isRightsValid(user);
	};

	// есть ли права редактировать/удалить личный чат
	this.isRightsValidForEditDeletePrivateChannel = function(user, privateChannel) {
		// редактировать/удалить личный чат может тот, кто является его создателем/получателем
		return (this.isRightsValid(user) &&
				(user.id.toString() === privateChannel.senderId.toString() ||
				user.id.toString() === privateChannel.recipientId.toString()));
	};

	//---- message

	// есть ли права добавить сообщение
	this.isRightsValidForAddMessage = function(user) {
		// добавить сообщение могут все
        return this.isRightsValid(user);
	};

	// есть ли права переместить сообщение
	this.isRightsValidForMoveMessage = function(user) {
		// переместить сообщение может админ (если оно не в личном чате!)
		return (this.isRightsValid(user) &&
				user.role === config.userRoles.admin);
	};

	// есть ли права редактировать/удалить сообщение
	this.isRightsValidForEditDeleteMessage = function(user, message) {
		// редактировать/удалить сообщение могут админ и модератор и юзер, если сообщение создано им
		return (this.isRightsValid(user) &&
				(user.role === config.userRoles.admin ||
				user.role === config.userRoles.moderator ||
				user.id.toString() === message.senderId.toString()));
	};
};

module.exports = rightsUtils;