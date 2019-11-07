'use strict';

import Promise from 'bluebird';
const actionTypes = require('./actionTypes');
const sectionModel = require('./mongoDB/models/section');
const subSectionModel = require('./mongoDB/models/subSection');

module.exports = {
	initSocket(http) {
		const io = require('socket.io')(http);
	
		// подключения клиентов
		io.on('connection', function(client){
			console.log('connection!');
	
			client.on('action', function(action){

				if (action && action.type) {
					switch (action.type) {

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

						case actionTypes.UPDATE_SECTION_BY_ID:
							// const tasks = [];

							// tasks.push(sectionModel.query({id: action.sectionId}))
							// tasks.push(subSectionModel.query({sectionId: action.sectionId}))

							// return Promise.all(tasks)
							// 	.spread((section, subSections) => {
							// 		let data = section;
							// 		data.subSections = subSections;

							// 		io.to(action.sectionId).emit('action', {
							// 			type: actionTypes.UPDATE_SECTION_BY_ID,
							// 			data: data,
							// 			sectionId: action.sectionId,
							// 		});
							// 		return true;
							// 	})

							// return sectionModel.query({id: action.sectionId})
							// 	.then((section) => {

							// 		io.emit('action', {
							// 			type: actionTypes.UPDATE_SECTION_BY_ID,
							// 			data: data,
							// 			sectionId: action.sectionId,
							// 		});
							// 		return true;
							// 	})

							return sectionModel.query()
								.then((sections) => {

									const updatedSection = sections.find(item => item.id === action.sectionId)[0];

									io.emit('action', {
										type: actionTypes.UPDATE_SECTIONS,
										data: sections,
									});

									io.emit('action', {
										type: actionTypes.UPDATE_SECTION_BY_ID,
										data: updatedSection,
										sectionId: action.sectionId,
									});
									return true;
								})

							break;

						case actionTypes.JOIN_ROOM:
							client.join(action.roomId);

							//io.to('2').emit('join');

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
