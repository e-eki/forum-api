'use strict';

const Promise = require('bluebird');
const actionTypes = require('../actionTypes');
const sectionModel = require('../mongoDB/models/section');
const config = require('../config');

// отправление по сокетам действий, связанных с разделами
const sectionSocketActions = new function() {

	// обновление раздела
	this.updateSection = function(io, action) {
		if (action.sectionId) {
			return sectionModel.query({id: action.sectionId})
				.then(results => {
					if (results && results.length) {
						const section = results[0];

						// отправляется тем, кто на главной странице (с разделами)
						io.to(config.defaultRoomId).emit('action', {
							type: actionTypes.UPDATE_SECTION_BY_ID,
							data: section,
							sectionId: action.sectionId,
							debug: 'default',
						});

						// тем, кто на странице данного раздела
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
		else {
			return false;
		}
	};

	// удаление раздела
	this.deleteSection = function(io, action) {
		if (action.sectionId) {
			// отправляется тем, кто на главной странице (с разделами)
			io.to(config.defaultRoomId).emit('action', {
				type: actionTypes.DELETE_SECTION_BY_ID,
				sectionId: action.sectionId,
				debug: 'default',
			});

			// тем, кто на странице данного раздела
			io.to(action.sectionId).emit('action', {
				type: actionTypes.DELETE_SECTION_BY_ID,
				sectionId: action.sectionId,
				debug: 'section',
			});

			return true;

			// return subSectionModel.query({sectionId: action.sectionId})
			// 	.then(results => {
			// 		if (results && results.length) {
			// 			const tasks = [];

			// 			results.forEach(item => {
			// 				tasks.push(channelModel.query({subSectionId: item.id}));

			// 				io.to(item.id).emit('action', {
			// 					type: actionTypes.DELETE_SECTION_BY_ID,
			// 					sectionId: action.sectionId,  //??
			// 					subSectionId: item.id,
			// 					debug: 'subSection',
			// 				});
			// 			})
			// 		}
					
			// 		return Promise.all(tasks);
			// 	})
			// 	.then(results => {
			// 		if (results && results.length) {
			// 			results.forEach(item => {
			// 				io.to(item.id).emit('action', {
			// 					type: actionTypes.DELETE_SECTION_BY_ID,
			// 					sectionId: action.sectionId,  //??
			// 					channelId: item.id,
			// 					debug: 'channel',
			// 				});
			// 			})
			// 		}
					
			// 		return true;
			// 	})								
		}
		else {
			return false;
		}
	};
};

module.exports = sectionSocketActions;