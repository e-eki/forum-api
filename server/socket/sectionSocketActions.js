'use strict';

const Promise = require('bluebird');
const actionTypes = require('../actionTypes');
const sectionModel = require('../mongoDB/models/section');
const config = require('../config');

const sectionSocketActions = new function() {

	// 
	this.updateSection = function(io, action) {
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

						io.to(section.id.toString()).emit('action', {
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
};

module.exports = sectionSocketActions;