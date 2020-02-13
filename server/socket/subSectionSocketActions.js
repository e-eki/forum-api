'use strict';

const Promise = require('bluebird');
const actionTypes = require('../actionTypes');
const subSectionModel = require('../mongoDB/models/subSection');
const config = require('../config');

// отправление по сокетам действий, связанных с подразделами
const subSectionSocketActions = new function() {

	// обновление подраздела
	this.updateSubSection = function(io, action) {
		if (action.subSectionId && action.sectionId) {
			return subSectionModel.query({id: action.subSectionId})
				.then(results => {
					if (results && results.length) {
						const subSection = results[0];

						// отправляется тем, кто на главной странице (с разделами)
						io.to(config.defaultRoomId).emit('action', {
							type: actionTypes.UPDATE_SUBSECTION_BY_ID,
							data: subSection,
							subSectionId: action.subSectionId,
							sectionId: action.sectionId,
							debug: 'default',
						});

						// тем, кто на странице этого подраздела
						io.to(action.subSectionId).emit('action', {
							type: actionTypes.UPDATE_SUBSECTION_BY_ID,
							data: subSection,
							subSectionId: action.subSectionId,
							sectionId: action.sectionId,
							debug: 'subSection',
						});

						// тем, кто на странице раздела, в котором данный подраздел
						io.to(action.sectionId).emit('action', {
							type: actionTypes.UPDATE_SUBSECTION_BY_ID,
							data: subSection,
							sectionId: action.sectionId,
							subSectionId: action.subSectionId,
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

	// удаление подраздела
	this.deleteSubSection = function(io, action) {
		if (action.sectionId && action.subSectionId) {

			// отправляется тем, кто на главной странице (с разделами)
			io.to(config.defaultRoomId).emit('action', {
				type: actionTypes.DELETE_SUBSECTION_BY_ID,
				subSectionId: action.subSectionId,
				sectionId: action.sectionId,
				debug: 'default',
			});

			// тем, кто на странице данного подраздела
			io.to(action.subSectionId).emit('action', {
				type: actionTypes.DELETE_SUBSECTION_BY_ID,
				subSectionId: action.subSectionId,
				sectionId: action.sectionId,
				debug: 'subSection',
			});

			// тем, кто на странице раздела, в котором данный подраздел
			io.to(action.sectionId).emit('action', {
				type: actionTypes.DELETE_SUBSECTION_BY_ID,
				sectionId: action.sectionId,
				subSectionId: action.subSectionId,
				debug: 'section',
			});

			return true;

			// return channelModel.query({subSectionId: action.subSectionId})
			// 	.then(results => {
			// 		if (results && results.length) {
			// 			results.forEach(item => {
			// 				io.to(item.id).emit('action', {
			// 					type: actionTypes.DELETE_SUBSECTION_BY_ID,
			// 					subSectionId: action.subSectionId,  //??
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

module.exports = subSectionSocketActions;