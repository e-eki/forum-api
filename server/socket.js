'use strict';

const actionTypes = require('./actionTypes');
const sectionModel = require('./mongoDB/models/section');

module.exports = {
	initSocket(http) {
		const io = require('socket.io')(http);
	
		// подключения клиентов
		io.on('connection', function(client){
			console.log('connection!');
	
			client.on('action', function(action){

				if (action && action.type) {
					switch (action.type) {

						case actionTypes.UPDATE_SECTIONS:
							return sectionModel.query()
								.then((sections) => {
									io.emit('action', {
										type: actionTypes.UPDATE_SECTIONS,
										data: sections,
									});
									return true;
								})

							break;

						case actionTypes.JOIN_ROOM:
							const roomId = action.roomId;

							client.join(roomId);

							io.to('2').emit('join');

							break;
						
						default:
							throw utils.initError('INTERNAL_SERVER_ERROR');
					}
				}
			});

			client.on('JOINED', function(action){

			});
	
			//io.emit('state', 1123);
		});
	
		return io;
	}
};
