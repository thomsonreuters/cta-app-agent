'use strict';

const defaultLogger = require('cta-logger');
const _ = require('lodash');
const SystemDetails = require('../../utils/systemdetails');

/**
 * ResultCollectorHelper class
 * @class
 * @property {CementHelper} cementHelper - cementHelper instance
 * @property {Logger} [logger] - cta-logger instance
 * @property {Object} [runningJob] - the currently running job
 */
class ResultCollectorHelper {
  /**
   * Create a new ResultCollectorHelper instance
   * @param {CementHelper} cementHelper - cementHelper instance
   * @param {Logger} [logger] - cta-logger instance
   */
  constructor(cementHelper, logger) {
    this.logger = logger || defaultLogger();

    if (cementHelper.constructor.name !== 'CementHelper') {
      throw new Error('missing/incorrect \'cementHelper\' CementHelper argument');
    } else {
      this.cementHelper = cementHelper;
    }

    this.runningJob = null;
  }

  setRunningJob(context) {
    const job = context.data;
    if (this.runningJob === null || (this.runningJob.executionId !== job.payload.executionId)) {
      this.runningJob = _.pick(job.payload, ['executionId', 'testSuiteId', 'testId']);
      this.runningJob.currentIndex = 0;
    } else {
      this.runningJob.testSuiteId = job.payload.testSuiteId;
      this.runningJob.testId = job.payload.testId;
    }
    context.emit('done', this.cementHelper.brickName);
  }

  createResult(context) {
    const that = this;
    const body = context.data.payload;
    if (this.runningJob === null) {
      context.emit('error', that.cementHelper.brickName, new Error('Creating Result failed: no job currently running'));
    } else {
      const resultPayload = _.pick(body, ['status', 'testId']);
      resultPayload.executionId = this.runningJob.executionId;
      resultPayload.testSuiteId = this.runningJob.testSuiteId;
      if (!resultPayload.hasOwnProperty('testId') || resultPayload.testId === undefined) {
        resultPayload.testId = this.runningJob.testId;
      }
      that.runningJob.currentIndex++;
      resultPayload.index = this.runningJob.currentIndex;
      resultPayload.ip = SystemDetails.ip;
      resultPayload.hostname = SystemDetails.hostname;
      resultPayload.timestamp = Date.now();
      const messageJob = {
        nature: {
          type: 'message',
          quality: 'produce',
        },
        payload: {
          nature: {
            type: 'result',
            quality: 'create',
          },
          payload: resultPayload,
        },
      };
      this.cementHelper.createContext(messageJob).publish()
        .on('done', function(brickname, response) {
          context.emit('done', that.cementHelper.brickName, response);
        });
    }
  }

  createState(context) {
    const that = this;
    const body = context.data.payload;
    if (this.runningJob === null) {
      context.emit('error', that.cementHelper.brickName, new Error('Creating State failed: no job currently running'));
    } else {
      const statePayload = _.pick(body, ['status', 'executionId']);
      if (!statePayload.hasOwnProperty('executionId') || statePayload.executionId === undefined) {
        statePayload.executionId = this.runningJob.executionId;
      }
      const finishedStates = ['finished', 'canceled', 'acked'];
      if (finishedStates.indexOf(statePayload.status) !== -1) {
        statePayload.index = this.runningJob.currentIndex;
        this.runningJob = null;
      }
      statePayload.ip = SystemDetails.ip;
      statePayload.hostname = SystemDetails.hostname;
      statePayload.timestamp = Date.now();
      const messageJob = {
        nature: {
          type: 'message',
          quality: 'produce',
        },
        payload: {
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: statePayload,
        },
      };
      this.cementHelper.createContext(messageJob).publish()
        .on('done', function(brickname, response) {
          context.emit('done', that.cementHelper.brickName, response);
        });
    }
  }

}

module.exports = ResultCollectorHelper;
