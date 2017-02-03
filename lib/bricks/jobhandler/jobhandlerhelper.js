'use strict';

const co = require('co');

/**
 * JobHandlerHelper class
 * @class
 * @property {Map<Executor>} executors - A Map of all the Executors available
 * @property {Map<Job>} runningJobs - A Map of all the Jobs being run by this JobHandler
 */
class JobHandlerHelper {
  /**
   * Create a new JobHandlerHelper instance
   * @param {Map<Executor>} executors - A Map of all the Executors available
   * @param {Map<Job>} runningJobs - A Map of all the Jobs being run by this JobHandler
   */
  constructor(executors, runningJobs) {
    if (Object.prototype.toString.call(executors) !== '[object Map]') {
      throw new Error('missing/incorrect \'executors\' Map argument');
    } else {
      this.executors = executors;
    }

    if (Object.prototype.toString.call(runningJobs) !== '[object Map]') {
      throw new Error('missing/incorrect \'runningJobs\' Map argument');
    } else {
      this.runningJobs = runningJobs;
    }
  }

  /**
   * Retrieve the right executor for a job
   * Returns undefined if no executor found
   * @param {Job} job - input job* @param job
   * @returns {Executor}
   */
  getExecutor(job) {
    let executor;
    if (job.nature.quality === 'cancel') {
      // if the job to be canceled is currently running
      if (this.runningJobs.has(job.payload.jobid)) {
        const jobToCancel = this.runningJobs.get(job.payload.jobid);
        executor = this.executors.get(jobToCancel.nature.quality);
      }
    } else {
      executor = this.executors.get(job.nature.quality);
    }
    return executor;
  }

  /**
   * Run an executor with provided job and callback
   * @param {Executor} executor - executor
   * @param {Job} job - input job
   * @param {Function} [callback] - called after job completion
   * @returns {Promise} - specific executor response returned after job acknowledgment
   */
  runExecutor(executor, job, callback) {
    const that = this;
    return co(function* findAndRunHandlerCoroutine() {
      that.runningJobs.set(job.id, job);
      const executorResponse = yield executor.process(job, function onJobFinished(err, response) {
        if (that.runningJobs.has(job.id)) {
          that.runningJobs.delete(job.id);
        }
        if (callback && typeof callback === 'function') {
          callback(err, response);
        }
      });
      return executorResponse;
    }).catch(function(err) {
      if (that.runningJobs.has(job.id)) {
        that.runningJobs.delete(job.id);
      }
      throw err;
    });
  }
}

module.exports = JobHandlerHelper;
