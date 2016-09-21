'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const JobQueue = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobqueue.js'));
const jobQueueOpts = {
  comparator: function comparator(jobA, jobB) {
    const priorityA = jobA.payload.hasOwnProperty('priority') ? jobA.payload.priority : self.DEFAULTS.priority;
    const priorityB = jobB.payload.hasOwnProperty('priority') ? jobB.payload.priority : self.DEFAULTS.priority;
    if (priorityA === priorityB) return -1;
    return priorityA - priorityB;
  },
  strategy: JobQueue.ArrayStrategy,
};
module.exports = jobQueueOpts;
