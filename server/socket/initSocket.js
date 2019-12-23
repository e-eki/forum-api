'use strict';

const Promise = require('bluebird');
const actionTypes = require('../actionTypes');
// const sectionModel = require('./mongoDB/models/section');
// const subSectionModel = require('./mongoDB/models/subSection');
// const channelModel = require('./mongoDB/models/channel');
// const messageModel = require('./mongoDB/models/message');
// const privateChannelModel = require('./mongoDB/models/privateChannel');
// const userInfoModel = require('./mongoDB/models/userInfo');
//const config = require('./config');
const utils = require('../utils/baseUtils');
//const messageUtils = require('./utils/messageUtils');
const sectionSocketActions = require('./sectionSocketActions');
const subSectionSocketActions = require('./subSectionSocketActions');
const channelSocketActions = require('./channelSocketActions');
const messageSocketActions = require('./messageSocketActions');
const privateChannelSocketActions = require('./privateChannelSocketActions');


module.exports = {
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
	
			client.on('action', function(action){

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

						//---SECTION

						case actionTypes.UPDATE_SECTION_BY_ID:

							return sectionSocketActions.updateSection(io, action);

							// if (action.sectionId) {
							// 	return sectionModel.query({id: action.sectionId})
							// 		.then(results => {

							// 			if (results && results.length) {
							// 				const section = results[0];

							// 				io.to(config.defaultRoomId).emit('action', {
							// 					type: actionTypes.UPDATE_SECTION_BY_ID,
							// 					data: section,
							// 					sectionId: action.sectionId,
							// 					debug: 'default',
							// 				});

							// 				io.to(section.id.toString()).emit('action', {
							// 					type: actionTypes.UPDATE_SECTION_BY_ID,
							// 					data: section,
							// 					sectionId: action.sectionId,
							// 					debug: 'section',
							// 				});
							// 			}
										
							// 			return true;
							// 		})
							// }

							//break;

						case actionTypes.DELETE_SECTION_BY_ID:

							return sectionSocketActions.deleteSection(io, action);

							// if (action.sectionId) {
							// 	io.to(config.defaultRoomId).emit('action', {
							// 		type: actionTypes.DELETE_SECTION_BY_ID,
							// 		sectionId: action.sectionId,
							// 		debug: 'default',
							// 	});
	
							// 	io.to(action.sectionId).emit('action', {
							// 		type: actionTypes.DELETE_SECTION_BY_ID,
							// 		sectionId: action.sectionId,
							// 		debug: 'section',
							// 	});

							// 	// return subSectionModel.query({sectionId: action.sectionId})
							// 	// 	.then(results => {
							// 	// 		if (results && results.length) {
							// 	// 			const tasks = [];

							// 	// 			results.forEach(item => {
							// 	// 				tasks.push(channelModel.query({subSectionId: item.id}));

							// 	// 				io.to(item.id).emit('action', {
							// 	// 					type: actionTypes.DELETE_SECTION_BY_ID,
							// 	// 					sectionId: action.sectionId,  //??
							// 	// 					subSectionId: item.id,
							// 	// 					debug: 'subSection',
							// 	// 				});
							// 	// 			})
							// 	// 		}
										
							// 	// 		return Promise.all(tasks);
							// 	// 	})
							// 	// 	.then(results => {
							// 	// 		if (results && results.length) {
							// 	// 			results.forEach(item => {
							// 	// 				io.to(item.id).emit('action', {
							// 	// 					type: actionTypes.DELETE_SECTION_BY_ID,
							// 	// 					sectionId: action.sectionId,  //??
							// 	// 					channelId: item.id,
							// 	// 					debug: 'channel',
							// 	// 				});
							// 	// 			})
							// 	// 		}
										
							// 	// 		return true;
							// 	// 	})								
							// }
							
							//break;

						//---SUBSECTION

						case actionTypes.UPDATE_SUBSECTION_BY_ID:

							return subSectionSocketActions.updateSubSection(io, action);

							// if (action.subSectionId && action.sectionId) {
							// 	return subSectionModel.query({id: action.subSectionId})
							// 		.then(results => {
							// 			if (results && results.length) {
							// 				const subSection = results[0];

							// 				io.to(config.defaultRoomId).emit('action', {
							// 					type: actionTypes.UPDATE_SUBSECTION_BY_ID,
							// 					data: subSection,
							// 					subSectionId: action.subSectionId,
							// 					sectionId: action.sectionId,
							// 					debug: 'default',
							// 				});
	
							// 				io.to(action.subSectionId).emit('action', {
							// 					type: actionTypes.UPDATE_SUBSECTION_BY_ID,
							// 					data: subSection,
							// 					subSectionId: action.subSectionId,
							// 					sectionId: action.sectionId,
							// 					debug: 'subSection',
							// 				});
	
							// 				io.to(action.sectionId).emit('action', {
							// 					type: actionTypes.UPDATE_SUBSECTION_BY_ID,
							// 					data: subSection,
							// 					sectionId: action.sectionId,
							// 					subSectionId: action.subSectionId,
							// 					debug: 'section',
							// 				});
							// 			}
							// 		})
							// }

							//break;

						case actionTypes.DELETE_SUBSECTION_BY_ID:

							return subSectionSocketActions.deleteSubSection(io, action);

							// if (action.sectionId && action.subSectionId) {
							// 	io.to(config.defaultRoomId).emit('action', {
							// 		type: actionTypes.DELETE_SUBSECTION_BY_ID,
							// 		subSectionId: action.subSectionId,
							// 		sectionId: action.sectionId,
							// 		debug: 'default',
							// 	});
	
							// 	io.to(action.subSectionId).emit('action', {
							// 		type: actionTypes.DELETE_SUBSECTION_BY_ID,
							// 		subSectionId: action.subSectionId,
							// 		sectionId: action.sectionId,
							// 		debug: 'subSection',
							// 	});

							// 	io.to(action.sectionId).emit('action', {
							// 		type: actionTypes.DELETE_SUBSECTION_BY_ID,
							// 		sectionId: action.sectionId,
							// 		subSectionId: action.subSectionId,
							// 		debug: 'section',
							// 	});

							// 	// return channelModel.query({subSectionId: action.subSectionId})
							// 	// 	.then(results => {
							// 	// 		if (results && results.length) {
							// 	// 			results.forEach(item => {
							// 	// 				io.to(item.id).emit('action', {
							// 	// 					type: actionTypes.DELETE_SUBSECTION_BY_ID,
							// 	// 					subSectionId: action.subSectionId,  //??
							// 	// 					channelId: item.id,
							// 	// 					debug: 'channel',
							// 	// 				});
							// 	// 			})
							// 	// 		}
										
							// 	// 		return true;
							// 	// 	})
							// }
							
							//break;

						//---CHANNEL
						case actionTypes.UPDATE_CHANNEL_BY_ID:

							return channelSocketActions.updateChannel(io, action);

							// if (action.channelId && action.subSectionId) {
							// 	return Promise.resolve(channelModel.query({id: action.channelId}))
							// 		.then(results => {
							// 			if (results && results.length) {
							// 				const channel = results[0];

							// 				return messageUtils.getDescriptionMessageInChannel(channel);
							// 			}
							// 			else {
							// 				return false;
							// 			}
							// 		})
							// 		.then(channel => {
							// 			io.to(action.channelId).emit('action', {
							// 				type: actionTypes.UPDATE_CHANNEL_BY_ID,
							// 				data: channel,
							// 				subSectionId: action.subSectionId,
							// 				channelId: action.channelId,
							// 				debug: 'channel',
							// 			});

							// 			io.to(action.subSectionId).emit('action', {
							// 				type: actionTypes.UPDATE_CHANNEL_BY_ID,
							// 				data: channel,
							// 				subSectionId: action.subSectionId,
							// 				channelId: action.channelId,
							// 				debug: 'subSection',
							// 			});
							// 		})
							// }

							//break;

						case actionTypes.DELETE_CHANNEL_BY_ID:

							return channelSocketActions.deleteChannel(io, action);
							// if (action.channelId && action.subSectionId) {
							// 	io.to(action.channelId).emit('action', {
							// 		type: actionTypes.DELETE_CHANNEL_BY_ID,
							// 		channelId: action.channelId,
							// 		subSectionId: action.subSectionId,
							// 		debug: 'channel',
							// 	});

							// 	io.to(action.subSectionId).emit('action', {
							// 		type: actionTypes.DELETE_CHANNEL_BY_ID,
							// 		channelId: action.channelId,
							// 		subSectionId: action.subSectionId,
							// 		debug: 'subSection',
							// 	});
							// }
							//break;

						//---MESSAGE
						case actionTypes.UPDATE_MESSAGE_BY_ID:

							return messageSocketActions.updateMessage(io, action);

							// if (action.messageId && action.channelId) {
							// 	return messageModel.query({id: action.messageId})
							// 		.then(results => {
							// 			if (results && results.length) {
							// 				const message = results[0];

							// 				// io.to(action.messageId).emit('action', {  //??
							// 				// 	type: actionTypes.UPDATE_MESSAGE_BY_ID,
							// 				// 	data: message,
							// 				// 	messageId: action.messageId,
							// 				// 	debug: 'message',
							// 				// });
	
							// 				io.to(action.channelId).emit('action', {
							// 					type: actionTypes.UPDATE_MESSAGE_BY_ID,
							// 					data: message,
							// 					messageId: action.messageId,
							// 					channelId: action.channelId,
							// 					debug: 'channel',
							// 				});

							// 				// если это личное сообщение, то о нем должен узнать получатель
							// 				if (action.recipientId) {
							// 					io.to(action.recipientId).emit('action', {
							// 						type: actionTypes.UPDATE_MESSAGE_BY_ID,
							// 						data: message,
							// 						messageId: action.messageId,
							// 						channelId: action.channelId,
							// 						recipientId: message.recipientId,
							// 						debug: 'recipientId',
							// 					});
							// 				}
							// 				// если это сообщение на форуме, то о нем должны узнать все, кто в соотв.подразделе
							// 				else {
							// 					return channelModel.query({id: action.channelId})
							// 						.then(results => {
							// 							if (results && results.length) {
							// 								const channel = results[0];

							// 								io.to(channel.subSectionId).emit('action', {
							// 									type: actionTypes.UPDATE_MESSAGE_BY_ID,
							// 									data: message,
							// 									messageId: action.messageId,
							// 									channelId: action.channelId,
							// 									debug: 'subSection',
							// 								});
							// 							}
							// 					})
							// 				}
							// 			}
							// 		})
							// }
							
							//break;

						case actionTypes.DELETE_MESSAGE_BY_ID:

							return messageSocketActions.deleteMessage(io, action);

							// if (action.messageId && action.channelId) {
							// 	// io.to(action.messageId).emit('action', {
							// 	// 	type: actionTypes.DELETE_MESSAGE_BY_ID,
							// 	// 	messageId: action.messageId,
							// 	// 	debug: 'message',
							// 	// });

							// 	io.to(action.channelId).emit('action', {
							// 		type: actionTypes.DELETE_MESSAGE_BY_ID,
							// 		messageId: action.messageId,
							// 		channelId: action.channelId,
							// 		debug: 'channel',
							// 	});
							// }
							//break;

						//---PRIVATE-CHANNEL
						case actionTypes.UPDATE_PRIVATE_CHANNEL_BY_ID:

							return privateChannelSocketActions.updatePrivateChannel(io, action);

							// if (action.privateChannelId) {
							// 	return privateChannelModel.query({id: action.privateChannelId})
							// 		.then(results => {
							// 			if (results && results.length) {
							// 				const privateChannel = results[0];

							// 				return messageUtils.getDescriptionMessageInChannel(privateChannel);
							// 			}
							// 			else {
							// 				return false;
							// 			}
							// 		})
							// 		.then(privateChannel => {
							// 			io.to(action.privateChannelId).emit('action', {
							// 				type: actionTypes.UPDATE_PRIVATE_CHANNEL_BY_ID,
							// 				data: privateChannel,
							// 				privateChannelId: action.privateChannelId,
							// 				debug: 'privateChannel',
							// 			});

							// 			if (action.senderId) {
							// 				io.to(action.senderId).emit('action', {
							// 					type: actionTypes.UPDATE_PRIVATE_CHANNEL_BY_ID,
							// 					data: privateChannel,
							// 					privateChannelId: action.privateChannelId,
							// 					debug: 'senderId',
							// 				});
							// 			}

							// 			if (action.recipientId) {
							// 				io.to(action.recipientId).emit('action', {
							// 					type: actionTypes.UPDATE_PRIVATE_CHANNEL_BY_ID,
							// 					data: privateChannel,
							// 					privateChannelId: action.privateChannelId,
							// 					debug: 'recipientId',
							// 				});
							// 			}
							// 		})
							// }

							//break;

						case actionTypes.DELETE_PRIVATE_CHANNEL_BY_ID:

							return privateChannelSocketActions.deletePrivateChannel(io, action);
							// if (action.privateChannelId) {
							// 	io.to(action.privateChannelId).emit('action', {
							// 		type: actionTypes.DELETE_PRIVATE_CHANNEL_BY_ID,
							// 		privateChannelId: action.privateChannelId,
							// 		debug: 'privateChannel',
							// 	});

							// 	if (action.senderId) {
							// 		io.to(action.senderId).emit('action', {
							// 			type: actionTypes.DELETE_PRIVATE_CHANNEL_BY_ID,
							// 			privateChannelId: action.privateChannelId,
							// 			debug: 'senderId',
							// 		});
							// 	}

							// 	if (action.recipientId) {
							// 		io.to(action.recipientId).emit('action', {
							// 			type: actionTypes.DELETE_PRIVATE_CHANNEL_BY_ID,
							// 			privateChannelId: action.privateChannelId,
							// 			debug: 'recipientId',
							// 		});
							// 	}
							// }
							//break;


						default:
							throw utils.initError('UNSUPPORTED_METHOD');  //??
					}
				}
			});
		});
	
		return io;
	}
};
