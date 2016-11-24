'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const defaultLogger = require('cta-logger');
const cp = require('child_process');
const nodepath = require('path');
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

  /**
   * Sets job as runningJob property of ResultCollector
   * @param context
   */
  setRunningJob(context) {
    const job = context.data;
    if (this.runningJob === null || (this.runningJob.executionId !== job.payload.executionId)) {
      this.runningJob = _.pick(job.payload, ['executionId', 'testSuiteId', 'testId']);
      this.runningJob.currentIndex = 0;
      this.runningJob.active = true;
    } else {
      this.runningJob.testSuiteId = job.payload.testSuiteId;
      this.runningJob.testId = job.payload.testId;
      this.runningJob.active = true;
    }
    context.emit('done', this.cementHelper.brickName);
  }

  /**
   * Creates a new Result payload and sends it as a message-produce context
   * @param context
   */
  createResult(context) {
    const that = this;
    const body = context.data.payload;
    if (this.runningJob === null || !this.runningJob.active) {
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
      this.cementHelper.createContext(messageJob)
        .on('done', function(brickname, response) {
          context.emit('done', that.cementHelper.brickName, response);
          if (resultPayload.status !== 'ok') {
            that.createResultScreenshot(resultPayload);
          }
        }).publish();
    }
  }

  /**
   * Creates a new State payload and sends it as a message-produce context
   * @param context
   */
  createState(context) {
    const that = this;
    const body = context.data.payload;
    if (this.runningJob === null && !body.hasOwnProperty('executionId')) {
      context.emit('error', that.cementHelper.brickName, new Error('Creating State failed: no job currently running'));
    } else {
      const statePayload = _.pick(body, ['status', 'message', 'executionId', 'testSuiteId', 'testId']);
      if (!statePayload.hasOwnProperty('executionId') || statePayload.executionId === undefined) {
        statePayload.executionId = this.runningJob.executionId;
      }
      const finishedStates = ['finished', 'canceled', 'acked', 'timeout'];
      if (finishedStates.indexOf(statePayload.status) !== -1) {
        if (this.runningJob !== null) {
          statePayload.index = this.runningJob.currentIndex;
          this.runningJob.active = false;
        } else {
          statePayload.index = 0;
        }
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
      this.cementHelper.createContext(messageJob)
        .on('done', function(brickname, response) {
          context.emit('done', that.cementHelper.brickName, response);
        })
        .publish();
    }
  }

  createResultScreenshot(result) {
    const that = this;
    if (process.platform === 'win32') {
      const directory = `%TEMP%\\cta\\${result.executionId}`;
      const filename = `[${result.hostname}][${result.testId}][${result.timestamp}].png`;
      const mkdirCmd = `(If Not Exist "${directory}" (mkdir "${directory}"))`;

      const fullpath = `${directory}\\${filename}`;
      const screenshotExe = nodepath.join(appRootPath,
        '/bin/screenshot-cmd.exe');
      const screenshotCmd = `${screenshotExe} -o "${fullpath}"`;
      const cmd = mkdirCmd + ' && ' + screenshotCmd;

      cp.exec(cmd, function(err, stdout, stderr) {
        if (stdout) {
          that.logger.debug(`Screenshot exec stdout: ${stdout}`);
        }
        if (stderr) {
          that.logger.error(`Screenshot exec stderr: ${stderr}`);
        }
        if (err !== null) {
          that.logger.error('Screenshot exec error', err);
        }
      });
    }
  }

}

module.exports = ResultCollectorHelper;
