'use strict';

const Promise = require('bluebird');
const actionTypes = require('./actionTypes');
const sectionModel = require('./mongoDB/models/section');
const subSectionModel = require('./mongoDB/models/subSection');
const channelModel = require('./mongoDB/models/channel');
const messageModel = require('./mongoDB/models/message');
const config = require('./config');

module.exports = {
	initSocket(http) {
		const io = require('socket.io')(http);
	
		// подключения клиентов
		io.on('connection', function(client){
			console.log('connection!');
	
			client.on('action', function(action){

				let tasks = [];

				if (action && action.type) {
					switch (action.type) {

						//---ROOM

						case actionTypes.JOIN_ROOM:
							client.join(action.roomId);
							//client.join('1');
							break;

						case actionTypes.LEAVE_ROOM:
							client.leave(action.roomId);
							break;

						// case actionTypes.UPDATE_SECTIONS:
						// 	return sectionModel.query()
						// 		.then((sections) => {
						// 			io.emit('action', {
						// 				type: actionTypes.UPDATE_SECTIONS,
						// 				data: sections,
						// 			});
						// 			return true;
						// 		})
						// 	break;

						//---SECTION

						case actionTypes.UPDATE_SECTION_BY_ID:
							// tasks = [];

							// tasks.push(sectionModel.query());

							// if (action.sectionId) {
							// 	tasks.push(sectionModel.query({id: action.sectionId}))
							// }
							// else {
							// 	tasks.push(false);
							// }

							// return Promise.all(tasks)
							// 	.spread((sections, section) => {
									// io.to(config.defaultRoomId).emit('action', {
									// 	type: actionTypes.UPDATE_SECTIONS,
									// 	data: sections,
									// });

							return sectionModel.query({id: action.sectionId})
								.then(section => {

									io.to(config.defaultRoomId).emit('action', {
										type: actionTypes.UPDATE_SECTION_BY_ID,
										data: section,
										sectionId: action.sectionId,
									});

									if (section) {
										io.to(section.id).emit('action', {
											type: actionTypes.UPDATE_SECTION_BY_ID,
											data: section,
											sectionId: action.sectionId,
										});
									}
									
									return true;
								})
							break;

						case actionTypes.DELETE_SECTION_BY_ID:
							return sectionModel.query()  //убрать
								.then(sections => {
									// io.to(config.defaultRoomId).emit('action', {
									// 	type: actionTypes.UPDATE_SECTIONS,
									// 	data: sections,
									// });

									io.to(config.defaultRoomId).emit('action', {
										type: actionTypes.DELETE_SECTION_BY_ID,
										sectionId: action.sectionId,
									});

									if (action.sectionId) {
										io.to(action.sectionId).emit('action', {
											type: actionTypes.DELETE_SECTION_BY_ID,
											sectionId: action.sectionId,
										});
									}
									
									return true;
								})
							break;

						//---SUBSECTION

						case actionTypes.UPDATE_SUBSECTION_BY_ID:
							tasks = [];

							if (action.subSectionId) {
								tasks.push(subSectionModel.query({id: action.subSectionId}));
							}
							else {
								tasks.push(false);
							}

							return Promise.all(tasks)
								.spread(subSection => {
									if (subSection) {
										io.to(config.defaultRoomId).emit('action', {
											type: actionTypes.UPDATE_SUBSECTION_BY_ID,
											data: subSection,
											subSectionId: action.subSectionId,
											sectionId: action.sectionId,
										});

										io.to(action.subSectionId).emit('action', {
											type: actionTypes.UPDATE_SUBSECTION_BY_ID,
											data: subSection,
											subSectionId: action.subSectionId,
											sectionId: action.sectionId,
										});

										if (action.sectionId) {  //проверкИ должна быть не здесь, а где-то вначале
											io.to(action.sectionId).emit('action', {
												type: actionTypes.UPDATE_SUBSECTION_BY_ID,
												data: subSection,
												sectionId: action.sectionId,
												subSectionId: action.subSectionId,
											});
										}
									}
								});
							break;

						case actionTypes.DELETE_SUBSECTION_BY_ID:
							io.to(config.defaultRoomId).emit('action', {
								type: actionTypes.DELETE_SUBSECTION_BY_ID,
								subSectionId: action.subSectionId,
								sectionId: action.sectionId,
							});

							if (action.subSectionId) {
								io.to(action.subSectionId).emit('action', {
									type: actionTypes.DELETE_SUBSECTION_BY_ID,
									subSectionId: action.subSectionId,
								});

								if (action.sectionId) {
									io.to(action.sectionId).emit('action', {
										type: actionTypes.DELETE_SUBSECTION_BY_ID,
										sectionId: action.sectionId,
										subSectionId: action.subSectionId,
									});
								}
							}
							break;

						//---CHANNEL
						case actionTypes.UPDATE_CHANNEL_BY_ID:
							tasks = [];

							if (action.channelId) {
								tasks.push(channelModel.query({id: action.channelId}));
							}
							else {
								tasks.push(false);
							}

							return Promise.all(tasks)
								.spread(channel => {
									if (channel) {
										io.to(action.channelId).emit('action', {
											type: actionTypes.UPDATE_CHANNEL_BY_ID,
											data: channel,
											channelId: action.channelId,
										});

										if (action.subSectionId) {
											io.to(action.subSectionId).emit('action', {
												type: actionTypes.UPDATE_CHANNEL_BY_ID,
												data: channel,
												subSectionId: action.subSectionId,
												channelId: action.channelId,
											});
										}
									}
								});
							break;

						case actionTypes.DELETE_CHANNEL_BY_ID:
							if (action.channelId) {
								io.to(action.channelId).emit('action', {
									type: actionTypes.DELETE_CHANNEL_BY_ID,
									channelId: action.channelId,
								});

								if (action.subSectionId) {
									io.to(action.subSectionId).emit('action', {
										type: actionTypes.DELETE_CHANNEL_BY_ID,
										channelId: action.channelId,
										subSectionId: action.subSectionId,
									});
								}
							}
							break;

						//---MESSAGE
						case actionTypes.UPDATE_MESSAGE_BY_ID:
							tasks = [];

							if (action.messageId) {
								tasks.push(messageModel.query({id: action.messageId}));
							}
							else {
								tasks.push(false);
							}

							return Promise.all(tasks)
								.spread(message => {
									if (message) {
										io.to(action.messageId).emit('action', {
											type: actionTypes.UPDATE_MESSAGE_BY_ID,
											data: message,
											messageId: action.messageId,
										});

										if (action.channelId) {
											io.to(action.channelId).emit('action', {
												type: actionTypes.UPDATE_MESSAGE_BY_ID,
												data: message,
												messageId: action.messageId,
												channelId: action.channelId,
											});
										}
									}
								});
							break;

						case actionTypes.DELETE_MESSAGE_BY_ID:
							if (action.messageId) {
								io.to(action.messageId).emit('action', {
									type: actionTypes.DELETE_MESSAGE_BY_ID,
									messageId: action.messageId,
								});

								if (action.channelId) {
									io.to(action.channelId).emit('action', {
										type: actionTypes.DELETE_MESSAGE_BY_ID,
										messageId: action.messageId,
										channelId: action.channelId,
									});
								}
							}
							break;

						
						default:
							throw utils.initError('INTERNAL_SERVER_ERROR');
					}
				}
			});

			// client.on('JOINED', function(action){
			// });
		});
	
		return io;
	}
};
