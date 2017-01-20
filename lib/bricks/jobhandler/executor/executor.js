/**
 * Created by U6020429 on 08/01/2016.
 */
'use strict';
const co = require('co');
const ObjectID = require('bson').ObjectID;

const STATES = {
  pending: 'pending',
  acked: 'acked',
  running: 'running',
  canceled: 'canceled',
  finished: 'finished',
  timeout: 'timeout',
};

const CANCELMODE = {
  MANUAL: 'manual',
  JOBTIMEOUT: 'executionTimeout',
};
/**
 * Executor class
 * @class
 * @property {Object} runningJobs - A Map of all the Jobs being run by this Executor instance
 * @property {Object} DEFAULTS - Defaults options
 * @property {Number} DEFAULTS.JOBTIMEOUT - The default timeout used to cancel Job after expiration
 */
class Executor {
  /**
   * Creates a new Job Executor instance
   * @constructs Executor
   * @param {Object} defaults - default properties for the executor
   * @param {Number} defaults.JOBTIMEOUT - default job timeout
   * @param {Object} logger - logger instance
   */
  constructor(defaults, logger) {
    this.runningJobs = {};
    this.STATES = STATES;
    this.CANCELMODE = CANCELMODE;
    this.DEFAULTS = {
      JOBTIMEOUT: 10000,
    };
    if (defaults) {
      if (defaults.hasOwnProperty('JOBTIMEOUT')) {
        if (typeof defaults.JOBTIMEOUT === 'number') {
          this.DEFAULTS.JOBTIMEOUT = defaults.JOBTIMEOUT;
        } else {
          throw new Error('incorrect \'JOBTIMEOUT\' number property');
        }
      }
    }
    this.logger = logger;
  }

  /**
   * Validates Job properties specific to Executor
   * @param {Job} job - input job
   * @param {Number} job.payload.timeout - timeout to cancel execution
   * @returns {Promise}
   */
  validate(job) {
    return new Promise((resolve, reject) => {
      if (job.nature.type === 'executions'
        && job.nature.quality === 'cancel') {
        if (!job.payload.hasOwnProperty('jobid') || !(ObjectID.isValid(job.payload.jobid))) {
          reject(new Error(
            'missing/incorrect \'jobid\' ObjectID property in cancel job.payload')
          );
        }

        if (job.payload.hasOwnProperty('mode') && typeof job.payload.mode !== 'string') {
          reject(new Error('incorrect \'mode\' String property in cancel job.payload'));
        }
      } else if (job.payload.hasOwnProperty('timeout')
        && typeof job.payload.timeout !== 'number') {
        reject(new Error('incorrect \'timeout\' number property in job payload'));
      }
      resolve({ ok: 1 });
    });
  }

  /**
   * Executes a Job: executes the job, returns a promise,
   * calls the provided callback when execution finishes.
   * @summary Executes a Job
   * @param {Job} job - input job
   * @param {processExitCallback} [callback] - an optional callback ran after execution is finished
   * @returns {Promise<ackResponse>}
   * @abstract
   * @private
   */
  _execute(job, callback) { // eslint-disable-line no-unused-vars
    throw new Error('abstract method should not be called');
  }

  /**
   * Cancels a Job: finds and cancels a running job with matched jobid,
   * returns a promise, calls the provided callback when cancelation finishes.
   * @summary Cancels a Job
   * @param {String} jobid - input job id
   * @param {String} mode - information about the cancelation
   * @param {processExitCallback} [callback] - an optional callback ran
   * after cancelation is finished
   * @return {Promise<ackResponse>}
   * @abstract
   * @private
   */
  _cancel(jobid, mode, callback) { // eslint-disable-line no-unused-vars
    throw new Error('abstract method should not be called');
  }

  /**
   * Process the job (cancel or set timeout + execute)
   * @param {Job} job - input job
   * @param {processExitCallback} [callback] - an optional callback ran after execution is finished
   * @returns {Promise<ackResponse>}
   */
  process(job, callback) {
    const that = this;
    return co(function* doJobCoroutine() {
      switch (job.nature.quality) {
        case 'cancel': {
          return yield that._cancel(job.payload.jobid,
            job.payload.mode || that.CANCELMODE.MANUAL,
            callback
          );
        }
        default: {
          that.runningJobs[job.id] = { job: job };
          return yield that._execute(job, callback);
        }
      }
    });
  }
}

/**
 * Callback called after a process has ended.
 * @callback processExitCallback
 * @property {Error} error - error
 * @property {finishResponse} response - the final response
 */

/**
 * @typedef {Object} ackResponse
 * @property {Number} ok - 0|1
 * @property {String} message - additionnal message from the execution
 * @property {ChildProcess} [process] - the process spawned by script
 * @property {Error} [error] - error
 */

/**
 * @typedef {Object} finishResponse
 * @property {Number} ok - 0|1
 * @property {String} state - the state of the Job
 * @property {String} message - additionnal message from the execution
 * @property {ChildProcess} [process] - the process spawned by script
 * @property {Number} [code] - the exit code of the spawned process
 * @property {Error} [error] - error
 */
exports = module.exports = Executor;
