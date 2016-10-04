'use strict';
const ObjectID = require('bson').ObjectID;
const defaultLogger = require('cta-logger');
const SystemDetails = require('../../utils/systemdetails');
const _ = require('lodash');

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
    const removed = that.runningJobs[quality].delete(jobid);
    if (!removed) {
      that.logger.warn(`tried to remove an unknown running ${quality} job (id: ${jobid}).`);
    }
    const noRunningJobs = Object.keys(that.runningJobs)
      .every(function(key) {
        return that.runningJobs[key].size === 0;
      });
    if (noRunningJobs && that.queue.isEmpty() > 0) {
      that.send(that.queue.dequeue());
    }
  }

  /**
   * Create a Context for an execution-acknowledge job for the provided Job, and send it
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
          const stateJob = _.cloneDeep(job);
          stateJob.payload.ip = SystemDetails.ip;
          stateJob.payload.hostname = SystemDetails.hostname;
          stateJob.payload.timestamp = Date.now();
          const messageJob = {
            nature: {
              type: 'message',
              quality: 'produce',
            },
            payload: stateJob,
          };
          context = this.createContextDefault(messageJob, options);
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

    if (!this.runningJobs.run.has(jobId)) {
      this.runningJobs.run.set(jobId, job);
      that.send({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          executionId: jobId,
          status: 'running',
          message: `Job ${jobId} started.`,
        },
      });
      that.ack(job);
    }

    let testIndex = 0;
    if (typeof options === 'object' && options !== null
      && options.hasOwnProperty('testIndex') && typeof options.testIndex === 'number') {
      testIndex = options.testIndex;
    }
    const execJob = {
      id: jobId,
      nature: {
        type: 'execution',
        quality: job.payload.testSuite.tests[testIndex].type,
      },
      payload: {
        timeout: job.payload.execution.runningTimeout,
        stages: job.payload.testSuite.tests[testIndex].stages,
      },
    };

    const context = that.cementHelper.createContext(execJob)
      .once('reject', function onContextReject(who, reject) {
        that.send({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: jobId,
            status: 'finished',
            error: reject,
            message: reject.message,
          },
        });
        that.remove(job);
      })
      .once('error', function onContextError(who, err) {
        that.send({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: jobId,
            status: 'finished',
            error: err,
            message: err.message,
          },
        });
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
      })
      .once('done', function onContextDone(who, res) {
        const hasBeenCanceled = res.hasOwnProperty('cancelMode') && res.cancelMode === 'MANUAL';
        const isLatestTest = testIndex + 1 >= job.payload.testSuite.tests.length;
        if (!isLatestTest && !hasBeenCanceled) {
          that.createContextForExecutionRun(job, { testIndex: testIndex + 1 }).publish();
        } else {
          that.send({
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: jobId,
              status: res.state,
              message: res.message,
            },
          });
          that.remove(job);
          if (that.runningJobs.read.has(job.payload.execution.id)) {
            if (hasBeenCanceled) {
              that.terminateGroupJob(job.payload.execution.id, {
                nature: {
                  type: 'state',
                  quality: 'create',
                },
                payload: {
                  executionId: job.payload.execution.id,
                  status: 'canceled',
                  message: `group Job ${job.payload.execution.id} canceled (MANUAL) during sub-Job ${jobId}`,
                },
              });
            } else {
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
          }
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
        quality: 'cancelation',
      },
      payload: {
        jobid: job.payload.execution.id,
      },
    };

    const context = that.cementHelper.createContext(cancelJob);
    context.once('accept', function onContextAccept() {
      that.ack(job);
    })
      .once('reject', function onContextReject() {
        that.ack(job);
        that.remove(job);
      })
      .once('done', function onContextDone() {
        that.remove(job);
      })
      .once('error', function onContextError() {
        that.remove(job);
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
   * createContext submethod for execution group job
   * @param {Job} job - the Job to send
   * @param {Object} [options] - optional arguments
   * @returns {Context} the created context
   */
  createContextForMessageGet(job, options) {
    const that = this;
    const context = that.cementHelper.createContext(job);
    context.once('accept', function onContextAccept(who) {
      if (job.payload.hasOwnProperty('groupExecutionId') && (options && options.first)) {
        that.send({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: job.payload.groupExecutionId,
            status: 'running',
            message: `GET message request for group Job ${job.payload.groupExecutionId} accepted by ${who}.`,
          },
        });
      }
    }).once('reject', function onContextReject(who, reject) {
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
      if (noMoreMessage && job.payload.hasOwnProperty('groupExecutionId')) {
        that.terminateGroupJob(job.payload.groupExecutionId, {
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: job.payload.groupExecutionId,
            status: (options && options.first) ? 'acked' : 'finished',
            message: `No more Jobs to run for group Job ${job.payload.groupExecutionId}.`,
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
   * process sub-method for default case (execution-commandline, execution-group)
   * @param {Job} job - the job to process
   */
  processDefault(job) {
    const that = this;
    const noRunningJobs = Object.keys(that.runningJobs)
      .every(function(key) {
        return that.runningJobs[key].size === 0;
      });
    if (!noRunningJobs) {
      if (job.payload.execution.priority === 0
        || this.runningJobs.read.has(job.payload.execution.id)) {
        this.send(job);
      } else {
        try {
          this.queue.queue(job);
          this.logger.info(`${this.cementHelper.brickName}: job ${job.payload.execution.id} has been queued.`);
        } catch (error) {
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
    }
  }

  /**
   * process sub-method for execution-Cancelation case
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
      this.send({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          executionId: cancelationJob.payload.execution.id,
          status: 'canceled',
          message: `Job ${cancelationJob.payload.execution.id} removed from queue successfully.`,
        },
      });
      this.ack(dequeued);
      // this.send({
      //   nature: {
      //     type: 'state',
      //     quality: 'create',
      //   },
      //   payload: {
      //     executionId: cancelationJob.id,
      //     status: 'finished',
      //     message: `Job ${cancelationJob.payload.jobid} removed from queue successfully.`,
      //   },
      // });
      this.ack(cancelationJob);
    } else {
      // this.send({
      //   nature: {
      //     type: 'state',
      //     quality: 'create',
      //   },
      //   payload: {
      //     executionId: cancelationJob.id,
      //     status: 'finished',
      //     message: `Job ${cancelationJob.payload.jobid} neither running nor queued. Nothing to cancel.`,
      //   },
      // });
      this.ack(cancelationJob);
    }
  }
}

module.exports = JobBrokerHelper;
