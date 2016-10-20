'use strict';
const ObjectID = require('bson').ObjectID;

class ReadJob {
  constructor(priority, queue) {
    const id = (new ObjectID()).toString();
    const job = {
      nature: {
        type: 'execution',
        quality: 'read',
      },
      payload: {
        execution: {
          id: id,
          priority: (priority !== undefined) && (priority !== null)
            ? priority : 2,
        },
        queue: queue || id,
      },
    };
    return job;
  }
}

module.exports = ReadJob;
