'use strict';

const Promise = require('bluebird');
const actionTypes = require('../actionTypes');
const userModel = require('../mongoDB/models/user');

// отправление по сокетам действий, связанных с данными юзера
const userSocketActions = new function() {

	// обновление данных юзера (роль, чс)
	this.updateUser = function(io, action) {
		if (action.userId) {
			return Promise.resolve(userModel.query({id: action.userId}))
				.then(results => {
					if (results && results.length) {
						const user = results[0];

						const data = {
							role: user.role,
							inBlackList: user.inBlackList
						};
						
						io.to(action.userId).emit('action', {
							type: actionTypes.UPDATE_USER,
							data: data,
							debug: 'user',
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