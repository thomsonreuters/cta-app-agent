'use strict';
const ObjectID = require('bson').ObjectID;
const defaultLogger = require('cta-logger');

/**
 * JobBrokerHelper class
 * @class
 * @property {CementHelper} cementHelper - cementHelper instance
 * @property {PriorityQueue} queue - PriorityQueue of Jobs
 * @property {Map<Job>} runningJobs - Array of Jobs being processed
 * @property {Logger} [logger] - cta-logger instance
 */
class JobBrokerHelper {
  /**
   * Create a new JobBrokerHelper instance
   * @param {CementHelper} cementHelper - cementHelper instance
   * @param {PriorityQueue} queue - PriorityQueue of Jobs
   * @param {Object} runningJobs - Object of Maps of Jobs being processed
   * @param {Logger} [logger] - cta-logger instance
   */
  constructor(cementHelper, queue, runningJobs, logger) {
    this.logger = logger || defaultLogger();

    if (cementHelper.constructor.name !== 'CementHelper') {
      throw new Error('missing/incorrect \'cementHelper\' CementHelper argument');
    } else {
      this.cementHelper = cementHelper;
    }

    if (queue.constructor.name !== 'JobQueue') {
      throw new Error('missing/incorrect \'queue\' JobQueue argument');
    } else {
      this.queue = queue;
    }

    if (runningJobs.constructor.name !== 'Object') {
      throw new Error('missing/incorrect \'runningJobs\' Object argument');
    } else {
      this.runningJobs = runningJobs;
    }
  }

  /**
   * Remove the a job from the runningJobs Map
   * Then if internal queue is not empty, send a dequeued job
   * @param {Job} job - the Job to remove
   * @private
   */
  remove(job) {
    const that = this;
    const quality = job.nature.quality;
    const jobid = job.payload.execution.id;
    if (that.runningJobs[quality].has(jobid)) {
      const runningJob = that.runningJobs[quality].get(jobid);
      if (runningJob.hasOwnProperty('timeout')) {
        clearTimeout(runningJob.timeout);
      }
      that.runningJobs[quality].delete(jobid);
    } else {
      that.logger.warn(`tried to remove an unknown running ${quality} job (id: ${jobid}).`);
    }
    const noRunningJobs = Object.keys(that.runningJobs)
      .every(function(key) {
        return that.runningJobs[key].size === 0;
      });
    if (noRunningJobs && that.queue.isEmpty() > 0) {
      const dequeued = that.queue.dequeue();
      if (dequeued.hasOwnProperty('pendingTimeout')) {
        clearTimeout(dequeued.pendingTimeout);
      }
      that.send(dequeued);
      this.setRunningTimeout(dequeued);
    }
  }

  /**
   * Create a Context for an message-acknowledge job for the provided Job, and send it
   * @param {Job} job - the Job to ack
   * @private
   */
  ack(job) {
    if (job.hasOwnProperty('id')) {
      const ackJob = {
        nature: {
          type: 'message',
          quality: 'acknowledge',
        },
        payload: {
          id: job.id,
        },
      };
      const groupjob = this.runningJobs.read.get(job.payload.execution.id);
      if (typeof groupjob !== 'undefined') {
        ackJob.payload.queue = groupjob.payload.queue;
      }
      this.send(ackJob);
    }
  }

  /**
   * Create a new context from a Job and set its listeners
   * @param {Job} job - the Job to send
   * @param {Object} [options] - optional arguments
   * @returns {Context} the created context
   * @private
   */
  createContext(job, options) {
    let context;
    const typeAndQuality = (`${job.nature.type}-${job.nature.quality}`);
    switch (typeAndQuality) {
      case 'execution-run':
        {
          context = this.createContextForExecutionRun(job, options);
          break;
        }
      case 'execution-cancel':
        {
          context = this.createContextForExecutionCancel(job, options);
          break;
        }
      case 'execution-read':
        {
          context = this.createContextForExecutionRead(job, options);
          break;
        }
      case 'message-get':
        {
          context = this.createContextForMessageGet(job, options);
          break;
        }
      case 'state-create':
        {
          context = this.createContextDefault(job, options);
          this.logger.info(`Execution: ${job.payload.executionId} (STATE) - Status: ${job.payload.status} - sent`);
          break;
        }
      case 'message-acknowledge':
      default:
        {
          context = this.createContextDefault(job, options);
          break;
        }
    }
    return context;
  }

  /**
   * createContext submethod for execution-run job
   * @param {Job} job - the Job to send
   * @param {Object} [options] - optional arguments
   * @param {Number} [options.testIndex] - index of the test to run in the tests Array
   * @returns {Context} the created context
   */
  createContextForExecutionRun(job, options) {
    const that = this;
    const jobId = job.payload.execution.id;

    let testIndex = 0;
    if (typeof options === 'object' && options !== null
      && options.hasOwnProperty('testIndex') && typeof options.testIndex === 'number') {
      testIndex = options.testIndex;
    }

    const setRunningJobForResult = {
      nature: {
        type: 'result',
        quality: 'setRunningJob',
      },
      payload: {
        executionId: job.payload.execution.id,
        testSuiteId: job.payload.testSuite.id,
        testId: job.payload.testSuite.tests[testIndex].id,
      },
    };
    that.send(setRunningJobForResult).on('done', function() {
      if (!that.runningJobs.run.has(jobId)) {
        that.runningJobs.run.set(jobId, job);
        that.ack(job);
        that.send({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: job.payload.execution.id,
            testSuiteId: job.payload.testSuite.id,
            testId: job.payload.testSuite.tests[testIndex].id,
            status: 'running',
            message: `Job ${jobId} started.`,
          },
        });
      }
    });

    const execJob = {
      id: jobId,
      nature: {
        type: 'execution',
        quality: job.payload.testSuite.tests[testIndex].type,
      },
      payload: {
        timeout: job.payload.execution.runningTimeout,
        executionId: job.payload.execution.id,
        testSuiteId: job.payload.testSuite.id,
        testId: job.payload.testSuite.tests[testIndex].id,
        stages: job.payload.testSuite.tests[testIndex].stages,
      },
    };
    const context = that.cementHelper.createContext(execJob, ['canceled', 'timeout'])
      .once('reject', function onContextReject(who, reject) {
        that.logger.error('Execution: ' + execJob.payload.executionId +
          ' (RUN)' +
          ' - TestSuite: ' + execJob.payload.testSuiteId +
          ' - Test: ' + execJob.payload.testId +
          ' - finished with rejection' + reject);
        that.send({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: job.payload.execution.id,
            testSuiteId: job.payload.testSuite.id,
            testId: job.payload.testSuite.tests[testIndex].id,
            status: 'finished',
            error: reject,
            message: reject.message,
          },
        });
        that.remove(job);
      })
      .once('progress', function onContextProgress() {
        that.logger.info('Execution: ' + execJob.payload.executionId +
          ' (RUN)' +
          ' - TestSuite: ' + execJob.payload.testSuiteId +
          ' - Test: ' + execJob.payload.testId +
          ' - running');
      })
      .once('error', function onContextError(who, err) {
        that.logger.error('Execution: ' + execJob.payload.executionId +
          ' (RUN)' +
          ' - TestSuite: ' + execJob.payload.testSuiteId +
          ' - Test: ' + execJob.payload.testId +
          ' - finished with error' + err);
        that.remove(job);
        if (that.runningJobs.read.has(job.payload.execution.id)) {
          const groupJob = that.runningJobs.read.get(job.payload.execution.id);
          that.send({
            nature: {
              type: 'message',
              quality: 'get',
            },
            payload: {
              groupExecutionId: groupJob.payload.execution.id,
              queue: groupJob.payload.queue,
            },
          });
        } else {
          that.send({
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: job.payload.execution.id,
              testSuiteId: job.payload.testSuite.id,
              testId: job.payload.testSuite.tests[testIndex].id,
              status: 'finished',
              error: err,
              message: err.message,
            },
          });
        }
      })
      .once('done', function onContextDone(who, res) {
        that.logger.info('Execution: ' + execJob.payload.executionId +
          ' (RUN)' +
          ' - TestSuite: ' + execJob.payload.testSuiteId +
          ' - Test: ' + execJob.payload.testId +
          ' - finished');

        const isLatestTest = testIndex + 1 >= job.payload.testSuite.tests.length;
        if (!isLatestTest) {
          that.createContextForExecutionRun(job, { testIndex: testIndex + 1 }).publish();
        } else {
          that.remove(job);
          if (that.runningJobs.read.has(job.payload.execution.id)) {
            const groupJob = that.runningJobs.read.get(job.payload.execution.id);
            that.send({
              nature: {
                type: 'message',
                quality: 'get',
              },
              payload: {
                groupExecutionId: groupJob.payload.execution.id,
                queue: groupJob.payload.queue,
              },
            });
          }
          that.send({
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: job.payload.execution.id,
              testSuiteId: job.payload.testSuite.id,
              testId: job.payload.testSuite.tests[testIndex].id,
              status: 'finished',
              message: res.message,
            },
          });
        }
      })
      .once('canceled', function onContextDone(who, res) {
        that.logger.info('Execution: ' + execJob.payload.executionId +
          ' (RUN)' +
          ' - TestSuite: ' + execJob.payload.testSuiteId +
          ' - Test: ' + execJob.payload.testId +
          ' - canceled');
        that.remove(job);
        if (that.runningJobs.read.has(job.payload.execution.id)) {
          that.terminateGroupJob(job.payload.execution.id, {
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: job.payload.execution.id,
              status: 'canceled',
              message: `group Job ${job.payload.execution.id} canceled (${res.cancelMode}) during sub-Job ${jobId}`,
            },
          });
        } else {
          that.send({
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: job.payload.execution.id,
              testSuiteId: job.payload.testSuite.id,
              testId: job.payload.testSuite.tests[testIndex].id,
              status: 'canceled',
              message: res.message,
            },
          });
        }
      })
      .once('timeout', function onContextDone(who, res) {
        that.logger.info('Execution: ' + execJob.payload.executionId +
          ' (RUN)' +
          ' - TestSuite: ' + execJob.payload.testSuiteId +
          ' - Test: ' + execJob.payload.testId +
          ' - timeout');
        that.remove(job);
        if (that.runningJobs.read.has(job.payload.execution.id)) {
          that.terminateGroupJob(job.payload.execution.id, {
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: job.payload.execution.id,
              testSuiteId: job.payload.testSuite.id,
              testId: job.payload.testSuite.tests[testIndex].id,
              status: 'timeout',
              message: `group Job ${job.payload.execution.id} timeout (${res.cancelMode}) during sub-Job ${jobId}`,
            },
          });
        } else {
          that.send({
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: job.payload.execution.id,
              testSuiteId: job.payload.testSuite.id,
              testId: job.payload.testSuite.tests[testIndex].id,
              status: 'timeout',
              message: res.message,
            },
          });
        }
      });
    return context;
  }

  /**
   * createContext submethod for execution-cancel job
   * @param {Job} job - the Job to send
   * @param {Object} [options] - optional arguments
   * @returns {Context} the created context
   */
  createContextForExecutionCancel(job) {
    const that = this;
    const jobId = job.payload.execution.id;
    this.runningJobs.cancel.set(jobId, job);

    const cancelJob = {
      id: (new ObjectID()).toString(),
      nature: {
        type: 'execution',
        quality: 'cancel',
      },
      payload: {
        jobid: job.payload.execution.id,
        mode: job.payload.mode || 'manual',
      },
    };

    const context = that.cementHelper.createContext(cancelJob)
      .once('accept', function onContextAccept() {
        that.ack(job);
      })
      .once('reject', function onContextReject(who, reject) {
        that.ack(job);
        that.remove(job);
        that.logger.error('Execution: ' + job.payload.execution.id +
          ' (CANCEL)' +
          ' - finished with rejection: ' + reject);
      })
      .once('progress', function onContextProgress() {
        that.logger.info('Execution: ' + job.payload.execution.id +
          ' (CANCEL)' +
          ' - running');
      })
      .once('done', function onContextDone() {
        that.remove(job);
        that.logger.info('Execution: ' + job.payload.execution.id +
          ' (CANCEL)' +
          ' - finished');
      })
      .once('error', function onContextError(who, err) {
        that.remove(job);
        that.logger.error('Execution: ' + job.payload.execution.id +
          ' (CANCEL)' +
          ' - finished with error: ' + err);
      });
    return context;
  }

  /**
   * createContext submethod for execution-read job
   * @param {Job} job - the Job to send
   * @param {Object} [options] - optional arguments
   * @returns {Context} the created context
   */
  createContextForExecutionRead(job) {
    const that = this;
    const jobId = job.payload.execution.id;
    that.runningJobs.read.set(jobId, job);
    const context = that.createContextForMessageGet({
      nature: {
        type: 'message',
        quality: 'get',
      },
      payload: {
        groupExecutionId: jobId,
        queue: job.payload.queue,
      },
    }, {
      first: true,
    });
    return context;
  }

  /**
   * createContext submethod for message-get job
   * @param {Job} job - the Job to send
   * @param {Object} [options] - optional arguments
   * @returns {Context} the created context
   */
  createContextForMessageGet(job, options) {
    const that = this;
    const context = that.cementHelper.createContext(job);
    context.once('accept', function onContextAccept() {
      that.logger.info('Execution: ' + job.payload.groupExecutionId +
        ' (READ)' +
        ' - Queue: ' + job.payload.queue +
        ' - reading');
      if (job.payload.hasOwnProperty('groupExecutionId') && (options && options.first)) {
        const setRunningJobForResult = {
          nature: {
            type: 'result',
            quality: 'setRunningJob',
          },
          payload: {
            executionId: job.payload.groupExecutionId,
          },
        };
        that.send(setRunningJobForResult);
      }
    }).once('reject', function onContextReject(who, reject) {
      that.logger.info('Execution: ' + job.payload.groupExecutionId +
        ' (READ)' +
        ' - Queue: ' + job.payload.queue +
        ' - reading rejected ' + reject);
      if (job.payload.hasOwnProperty('groupExecutionId')) {
        that.terminateGroupJob(job.payload.groupExecutionId, {
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: job.payload.groupExecutionId,
            status: 'acked',
            message: `message-get job was rejected by ${who} with: ${reject.message}.`,
            error: reject,
          },
        });
      }
    }).once('done', function onContextDone(who, noMoreMessage) {
      that.logger.info('Execution: ' + job.payload.groupExecutionId +
        ' (READ)' +
        ' - Queue: ' + job.payload.queue +
        ` - ${noMoreMessage ? 'received none' : 'received'}`);
      if (noMoreMessage && job.payload.hasOwnProperty('groupExecutionId')) {
        if (options && options.first) {
          that.terminateGroupJob(job.payload.groupExecutionId, {
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: job.payload.groupExecutionId,
              status: 'acked',
              message: `No more Jobs to run for group Job ${job.payload.groupExecutionId}.`,
            },
          });
        } else {
          that.terminateGroupJob(job.payload.groupExecutionId);
        }
      }
    }).once('error', function onContextReject(who, err) {
      that.logger.info('Execution: ' + job.payload.groupExecutionId +
        ' (READ)' +
        ' - Queue: ' + job.payload.queue +
        ' - reading failed ' + err);
      if (job.payload.hasOwnProperty('groupExecutionId')) {
        that.terminateGroupJob(job.payload.groupExecutionId, {
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: job.payload.groupExecutionId,
            status: 'acked',
            message: `message-get job finished by ${who} with error: ${err.message}.`,
            error: err,
          },
        });
      }
    });
    return context;
  }

  /**
   * createContext submethod for default case
   * @param {Job} job - the Job to send
   * @param {Object} [options] - optional arguments
   * @returns {Context} the created context
   */
  createContextDefault(job) {
    return this.cementHelper.createContext(job);
  }

  /**
   * Create a new context from a Job, set its listeners and publish it
   * @param {Job} job - the Job to send
   * @returns {Context} the created context
   * @private
   */
  send(job) {
    return this.createContext(job).publish();
  }

  /**
   * Terminate a group Job (ack, send create, remove)
   * @param {ObjectId|String} groupExecutionId - the id of the group Execution to terminate
   * @param {Job} [create] - an optional execution-create to send
   * @private
   */
  terminateGroupJob(groupExecutionId, create) {
    if (this.runningJobs.read.has(groupExecutionId)) {
      const groupjob = this.runningJobs.read.get(groupExecutionId);
      this.ack(groupjob);
      if (create) {
        this.send(create);
      }
      this.remove(groupjob);
    }
  }

  /**
   * Creates a timeout for handling pendingTimeout process
   * @param job
   */
  setPendingTimeout(job) {
    const jobid = job.payload.execution.id;
    const pendingTimestamp =
      job.payload.execution.requestTimestamp + job.payload.execution.pendingTimeout;
    const timeout = pendingTimestamp - Date.now();
    job.pendingTimeout = setTimeout(() => {
      this.logger.info(`Job Pending Timeout exceeded for Job ${jobid}`);
      const cancelationJob = {
        nature: {
          type: 'execution',
          quality: 'cancel',
        },
        payload: {
          execution: {
            id: jobid,
          },
          mode: 'pendingTimeout',
        },
      };
      this.cancel(cancelationJob);
    }, timeout);
  }

  /**
   * Creates a timeout for handling runningTimeout
   * @param job
   */
  setRunningTimeout(job) {
    const jobid = job.payload.execution.id;
    const timeout = job.payload.execution.runningTimeout;
    job.timeout = setTimeout(() => {
      this.logger.info(`Job Running Timeout exceeded for Job ${jobid}`);
      const cancelationJob = {
        nature: {
          type: 'execution',
          quality: 'cancel',
        },
        payload: {
          execution: {
            id: jobid,
          },
          mode: 'executionTimeout',
        },
      };
      this.cancel(cancelationJob);
    }, timeout);
  }

  /**
   * process sub-method for default case (execution-run and execution-read)
   * @param {Job} job - the job to process
   */
  processDefault(job) {
    const that = this;
    const pendingTimestamp =
      job.payload.execution.requestTimestamp + job.payload.execution.pendingTimeout;
    const timeout = pendingTimestamp - Date.now();
    if (timeout <= 0) {
      this.logger.info(`Job Pending Timeout exceeded for Job ${job.payload.execution.id}`);
      this.send({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          executionId: job.payload.execution.id,
          status: 'timeout',
          message: 'Job Pending Timeout exceeded.',
        },
      });
      this.ack(job);
    } else {
      const noRunningJobs = Object.keys(that.runningJobs)
        .every(function(key) {
          return that.runningJobs[key].size === 0;
        });
      if (!noRunningJobs) {
        if (job.payload.execution.priority === 0) {
          this.send(job);
          this.setRunningTimeout(job);
        } else if (this.runningJobs.read.has(job.payload.execution.id)) {
          this.send(job);
        } else {
          this.setPendingTimeout(job);
          try {
            this.queue.queue(job);
            this.logger.info(`Execution: ${job.payload.execution.id} - State: queued`);
          } catch (error) {
            clearTimeout(job.pendingTimeout);
            this.send({
              nature: {
                type: 'state',
                quality: 'create',
              },
              payload: {
                executionId: job.payload.execution.id,
                status: 'finished',
                error: error,
                message: error.message,
              },
            });
            this.ack(job);
          }
        }
      } else {
        this.send(job);
        this.setRunningTimeout(job);
      }
    }
  }

  /**
   * process sub-method for execution-cancel case
   * @param {Job} cancelationJob - the Cancelation job
   */
  cancel(cancelationJob) {
    if (this.runningJobs.read.has(cancelationJob.payload.execution.id)) {
      this.send(cancelationJob);
    } else if (this.runningJobs.run.has(cancelationJob.payload.execution.id)) {
      this.send(cancelationJob);
    } else {
      this.cancelQueuedJob(cancelationJob);
    }
  }

  /**
   * cancel sub-method for canceling queued job
   * @param {Job} cancelationJob - the Cancelation job
   */
  cancelQueuedJob(cancelationJob) {
    const dequeued = this.queue.remove(cancelationJob.payload.execution.id);
    if (dequeued) {
      if (dequeued.hasOwnProperty('pendingTimeout')) {
        clearTimeout(dequeued.pendingTimeout);
      }
      const state = {
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          executionId: cancelationJob.payload.execution.id,
          status: 'canceled',
          message: 'Job removed from queue successfully.',
        },
      };
      switch (cancelationJob.payload.mode) {
        case 'pendingTimeout': {
          state.payload.message = 'Job Pending Timeout exceeded.';
          state.payload.status = 'timeout';
          break;
        }
        default: {
          state.payload.message = 'Job removed from queue successfully.';
          break;
        }
      }
      this.send(state);
      this.ack(dequeued);
      this.ack(cancelationJob);
    } else {
      this.ack(cancelationJob);
    }
  }
}

module.exports = JobBrokerHelper;
