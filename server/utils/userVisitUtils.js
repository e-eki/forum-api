'use strict';

const Promise = require('bluebird');
const userVisitDataModel = require('../mongoDB/models/userVisitData');

const userVisitUtils = new function() {

    this.resetUserVisitData = function(userId) {
        return userVisitDataModel.query({userId: userId})
			.then(results => {
				if (results && results.length) {
					const userVisitData = results[0];

					userVisitData.lastVisitData = [];

					return userVisitDataModel.update(userVisitData.id, userVisitData);
				}
				else {
					return false; //?
				}
			})
    };
};

module.exports = userVisitUtils;