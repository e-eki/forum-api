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

			// client.on('disconnect', function () {  //todo??
			// 	const rooms = Object.keys(client.rooms);

			// 	rooms.forEach(room => {
			// 		client.leave(room);
			// 	})
			// });
	
			client.on('action', function(action){

				let tasks = [];

				if (action && action.type) {
					switch (action.type) {

						//---ROOM

						case actionTypes.JOIN_ROOM:

							if (action.roomId) {
								client.join(action.roomId);
							}
							//client.join('1');
							break;

						case actionTypes.LEAVE_ROOM:

							if (action.roomId) {
								client.leave(action.roomId);
							}
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

							if (action.sectionId) {
								return sectionModel.query({id: action.sectionId})
									.then(results => {

										if (results && results.length) {
											const section = results[0];

											io.to(config.defaultRoomId).emit('action', {
												type: actionTypes.UPDATE_SECTION_BY_ID,
												data: section,
												sectionId: action.sectionId,
												debug: 'default',
											});

											io.to(section.id).emit('action', {
												type: actionTypes.UPDATE_SECTION_BY_ID,
												data: section,
												sectionId: action.sectionId,
												debug: 'section',
											});
										}
										
										return true;
									})
							}

							break;

						case actionTypes.DELETE_SECTION_BY_ID:
							// return sectionModel.query()
							// 	.then(sections => {
							// 		// io.to(config.defaultRoomId).emit('action', {
							// 		// 	type: actionTypes.UPDATE_SECTIONS,
							// 		// 	data: sections,
							// 		// });

							// 		io.to(config.defaultRoomId).emit('action', {
							// 			type: actionTypes.DELETE_SECTION_BY_ID,
							// 			sectionId: action.sectionId,
							// 		});

							// 		if (action.sectionId) {
							// 			io.to(action.sectionId).emit('action', {
							// 				type: actionTypes.DELETE_SECTION_BY_ID,
							// 				sectionId: action.sectionId,
							// 			});
							// 		}
									
							// 		return true;
							// 	})

							if (action.sectionId) {
								io.to(config.defaultRoomId).emit('action', {
									type: actionTypes.DELETE_SECTION_BY_ID,
									sectionId: action.sectionId,
									debug: 'default',
								});
	
								io.to(action.sectionId).emit('action', {
									type: actionTypes.DELETE_SECTION_BY_ID,
									sectionId: action.sectionId,
									debug: 'section',
								});
							}
							
							break;

						//---SUBSECTION

						case actionTypes.UPDATE_SUBSECTION_BY_ID:

							if (action.subSectionId && action.sectionId) {
								return subSectionModel.query({id: action.subSectionId})
									.then(results => {
										if (results && results.length) {
											const subSection = results[0];

											io.to(config.defaultRoomId).emit('action', {
												type: actionTypes.UPDATE_SUBSECTION_BY_ID,
												data: subSection,
												subSectionId: action.subSectionId,
												sectionId: action.sectionId,
												debug: 'default',
											});
	
											io.to(action.subSectionId).emit('action', {
												type: actionTypes.UPDATE_SUBSECTION_BY_ID,
												data: subSection,
												subSectionId: action.subSectionId,
												//sectionId: action.sectionId,
												debug: 'subSection',
											});
	
											io.to(action.sectionId).emit('action', {
												type: actionTypes.UPDATE_SUBSECTION_BY_ID,
												data: subSection,
												sectionId: action.sectionId,
												subSectionId: action.subSectionId,
												debug: 'section',
											});
										}
									})
							}

							break;

						case actionTypes.DELETE_SUBSECTION_BY_ID:

							if (action.sectionId && action.subSectionId) {
								io.to(config.defaultRoomId).emit('action', {
									type: actionTypes.DELETE_SUBSECTION_BY_ID,
									subSectionId: action.subSectionId,
									sectionId: action.sectionId,
									debug: 'default',
								});
	
								io.to(action.subSectionId).emit('action', {
									type: actionTypes.DELETE_SUBSECTION_BY_ID,
									subSectionId: action.subSectionId,
									//sectionId: action.sectionId,
									debug: 'subSection',
								});

								io.to(action.sectionId).emit('action', {
									type: actionTypes.DELETE_SUBSECTION_BY_ID,
									sectionId: action.sectionId,
									subSectionId: action.subSectionId,
									debug: 'section',
								});
							}
							
							break;

						//---CHANNEL
						case actionTypes.UPDATE_CHANNEL_BY_ID:

							if (action.channelId && action.subSectionId) {
								return channelModel.query({id: action.channelId})
									.then(results => {
										if (results && results.length) {
											const channel = results[0];

											io.to(action.channelId).emit('action', {
												type: actionTypes.UPDATE_CHANNEL_BY_ID,
												data: channel,
												channelId: action.channelId,
												debug: 'channel',
											});
	
											if (action.subSectionId) {
												io.to(action.subSectionId).emit('action', {
													type: actionTypes.UPDATE_CHANNEL_BY_ID,
													data: channel,
													subSectionId: action.subSectionId,
													channelId: action.channelId,
													debug: 'subSection',
												});
											}
										}
									})
							}

							break;

						case actionTypes.DELETE_CHANNEL_BY_ID:
							if (action.channelId && action.subSectionId) {
								io.to(action.channelId).emit('action', {
									type: actionTypes.DELETE_CHANNEL_BY_ID,
									channelId: action.channelId,
									debug: 'channel',
								});

								io.to(action.subSectionId).emit('action', {
									type: actionTypes.DELETE_CHANNEL_BY_ID,
									channelId: action.channelId,
									subSectionId: action.subSectionId,
									debug: 'subSection',
								});
							}
							break;

						//---MESSAGE
						case actionTypes.UPDATE_MESSAGE_BY_ID:

							if (action.messageId && action.channelId) {
								return messageModel.query({id: action.messageId})
									.then(results => {
										if (results && results.length) {
											const message = results[0];

											io.to(action.messageId).emit('action', {  //??
												type: actionTypes.UPDATE_MESSAGE_BY_ID,
												data: message,
												messageId: action.messageId,
												debug: 'message',
											});
	
											io.to(action.channelId).emit('action', {
												type: actionTypes.UPDATE_MESSAGE_BY_ID,
												data: message,
												messageId: action.messageId,
												channelId: action.channelId,
												debug: 'channel',
											});
										}
									})
							}
							
							break;

						case actionTypes.DELETE_MESSAGE_BY_ID:
							if (action.messageId && action.channelId) {
								io.to(action.messageId).emit('action', {
									type: actionTypes.DELETE_MESSAGE_BY_ID,
									messageId: action.messageId,
									debug: 'message',
								});

								io.to(action.channelId).emit('action', {
									type: actionTypes.DELETE_MESSAGE_BY_ID,
									messageId: action.messageId,
									channelId: action.channelId,
									debug: 'channel',
								});
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
