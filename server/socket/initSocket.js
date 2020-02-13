'use strict';

const Promise = require('bluebird');
const actionTypes = require('../actionTypes');
const config = require('../config');
const utils = require('../utils/baseUtils');
const sectionSocketActions = require('./sectionSocketActions');
const subSectionSocketActions = require('./subSectionSocketActions');
const channelSocketActions = require('./channelSocketActions');
const messageSocketActions = require('./messageSocketActions');
const privateChannelSocketActions = require('./privateChannelSocketActions');
const userSocketActions = require('./userSocketActions');
const userVisitUtils = require('../utils/userVisitUtils');

module.exports = {
	// инициализация подключения по сокетам
	initSocket(http) {
		const io = require('socket.io')(http);
	
		// подключения клиентов
		io.on('connection', function(client){
			console.log('connection!');

			// client.on('disconnect', function () {  //todo??
			// 	const rooms = Object.keys(client.rooms);

			// 	// rooms.forEach(room => {
			// 	// 	client.leave(room);
			// 	// })
			// });
	
			// Операции создания/редактирования/отмены: клиент отправляет соответствующий запрос на апи сервера,
			// после получения ответа с сервера об успешном выполнении, отправляет по сокетам на сервер сообщение ("действие")
			// с информацией об этой операции. Сервер получает это сообщение по сокетам и по сокетам же рассылает
			// соответствующим группам клиентов сообщение ("действие") с информацией об операции.
			// Далее, клиенты получают с сервера эти сообщения и выполняют нужные перерисовки страницы.

			// получение действий с клиентов
			// UPDATE в названии типа действия подразумевает создание или редактирование
			client.on('action', function(action){

				if (action && action.type) {
					switch (action.type) {

						//---ROOM

						// присоединиться к комнате
						case actionTypes.JOIN_ROOM:
							if (action.roomId) {
								client.join(action.roomId);

								// если тип комнаты - чат/личный чат, то обновляем данные о последнем посещении юзером чата
								if ((action.roomType === config.roomTypes.channel ||
									action.roomType === config.roomTypes.privateChannel) &&
									action.userId) {
										return userVisitUtils.updateLastVisitChannel(action.userId, action.roomId);
								}
							}
							else {
								return true;
							}
							break;

						// покинуть комнату
						case actionTypes.LEAVE_ROOM:
							if (action.roomId) {
								client.leave(action.roomId);

								// если тип комнаты - чат/личный чат, то обновляем данные о последнем посещении юзером чата
								if ((action.roomType === config.roomTypes.channel ||
									action.roomType === config.roomTypes.privateChannel) &&
									action.userId) {
										return userVisitUtils.updateLastVisitChannel(action.userId, action.roomId);
								}
							}
							else {
								return true;
							}
							break;

						//---SECTION

						// обновление раздела
						case actionTypes.UPDATE_SECTION_BY_ID:
							return sectionSocketActions.updateSection(io, action);

						// удаление раздела
						case actionTypes.DELETE_SECTION_BY_ID:
							return sectionSocketActions.deleteSection(io, action);

						//---SUBSECTION

						// обновление подраздела
						case actionTypes.UPDATE_SUBSECTION_BY_ID:
							return subSectionSocketActions.updateSubSection(io, action);

						// удаление подраздела
						case actionTypes.DELETE_SUBSECTION_BY_ID:
							return subSectionSocketActions.deleteSubSection(io, action);

						//---CHANNEL

						// обновление чата
						case actionTypes.UPDATE_CHANNEL_BY_ID:
							return channelSocketActions.updateChannel(io, action);

						// удаление чата
						case actionTypes.DELETE_CHANNEL_BY_ID:
							return channelSocketActions.deleteChannel(io, action);

						//---MESSAGE

						// обновление сообщения
						case actionTypes.UPDATE_MESSAGE_BY_ID:
							return messageSocketActions.updateMessage(io, action);

						// удаление сообщения
						case actionTypes.DELETE_MESSAGE_BY_ID:
							return messageSocketActions.deleteMessage(io, action);

						//---PRIVATE-CHANNEL

						// обновление личного чата
						case actionTypes.UPDATE_PRIVATE_CHANNEL_BY_ID:
							return privateChannelSocketActions.updatePrivateChannel(io, action);

						// удаление личного чата
						case actionTypes.DELETE_PRIVATE_CHANNEL_BY_ID:
							return privateChannelSocketActions.deletePrivateChannel(io, action);

						//---USER

						// обновление данных юзера
						case actionTypes.UPDATE_USER:
							return userSocketActions.updateUser(io, action);

						default:
							//throw utils.initError('UNSUPPORTED_METHOD');  //??
							return false;
					}
				}
			});
		});
	
		return io;
	}
};
