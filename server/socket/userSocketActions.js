'use strict';

const Promise = require('bluebird');
const actionTypes = require('../actionTypes');
const userModel = require('../mongoDB/models/user');

// отправление по сокетам действий, связанных с данными юзера
const userSocketActions = new function() {

	// обновление данных юзера (роль, чс)
	this.updateUserData = function(io, action) {
		if (action.userId) {
			return Promise.resolve(userModel.query({id: action.userId}))
				.then(results => {
					if (results && results.length) {
						const user = results[0];

						const data = {
							role: user.role
						};
						
						io.to(action.userId).emit('action', {
							type: actionTypes.UPDATE_USER_DATA,
							data: data,
							debug: 'user-data',
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

module.exports = userSocketActions;