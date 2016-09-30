'use strict';
const ObjectID = require('bson').ObjectID;

const job = {
  nature: {
    type: 'execution',
    quality: 'run',
  },
  payload: {
    execution: {
      id: (new ObjectID()).toString(),
      priority: 2,
    },
  },
};

module.exports = job;
