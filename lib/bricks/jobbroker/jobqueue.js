'use strict';

const PriorityQueue = require('js-priority-queue');
const _ = require('lodash');
const ObjectID = require('bson').ObjectID;

/**
 * JobQueue class
 * @class
 * @extends PriorityQueue
 */
class JobQueue extends PriorityQueue {
  /**
   * Checks if job is present in queue
   * @param {String} id - id of the job
   * @returns {Boolean}
   */
  has(id) {
    return this.priv.data.some(job => job.payload.execution.id === id);
  }

  /**
   * Checks if queue is empty
   * @returns {Boolean}
   */
  isEmpty() {
    return (this.priv.data.length > 0);
  }

  /**
   * Removes a specific job
   * @param {String} id - id of the job to remove
   * @returns {Job} the removed job
   */
  remove(id) {
    return _.remove(this.priv.data, job => job.payload.execution.id === id)[0];
  }

  /**
   * Inserts a new job in the queue
   * @param {Job} job - job to insert
   */
  queue(job) {
    if (!job.payload.execution.hasOwnProperty('id') || !(ObjectID.isValid(job.payload.execution.id))) {
      throw (new Error('missing/incorrect \'id\' ObjectID property in job.payload.execution'));
    }
    if (this.has(job.payload.execution.id)) {
      throw new Error(`A job with id ${job.payload.execution.id} is already present in queue.`);
    } else {
      super.queue(job);
    }
    return this;
  }
}

exports = module.exports = JobQueue;
