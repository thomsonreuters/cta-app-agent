'use strict';
const ObjectID = require('bson').ObjectID;
const defaultLogger = require('cta-logger');
const Utils = require('./utils.js');

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
   * @param {Map<Job>} runningJobs - Array of Jobs being processed
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

    if (runningJobs.constructor.name !== 'Map') {
      throw new Error('missing/incorrect \'runningJobs\' Map argument');
    } else {
      this.runningJobs = runningJobs;
    }
  }

  /**
   * Remove the a job from the runningJobs Map
   * Then if internal queue is not empty, send a dequeued job
   * @param {String} jobid - the id of the Job to remove
   * @private
   */
  remove(jobid) {
    const that = this;
    const removed = that.runningJobs.delete(jobid);
    if (!removed) {
      that.logger.warn(`tried to remove an unknown running job (id: ${jobid}).`);
    }
    if (that.runningJobs.size === 0 && that.queue.isEmpty() > 0) {
      that.send(that.queue.dequeue());
    }
  }

  /**
   * Create a Context for an execution-acknowledge job for the provided Job, and send it
   * @param {Job} job - the Job to ack
   * @returns {Context} the created ack context
   * @private
   */
  ack(job) {
    const ackJob = {
      nature: {
        type: 'message',
        quality: 'acknowledge',
      },
      payload: {
        id: job.id,
      },
    };
    const groupjob = this.runningJobs.get(job.payload.groupjobid);
    if (typeof groupjob !== 'undefined') {
      ackJob.payload.queue = groupjob.payload.queue;
    }
    return this.send(ackJob);
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
    const typeAndQuality = (`${job.nature.type}-${job.nature.quality}`).toLowerCase();
    switch (typeAndQuality) {
      case 'execution-commandline':
      case 'execution-cancelation':
        {
          context = this.createContextForCommandline(job, options);
          break;
        }
      case 'execution-group':
        {
          context = this.createContextForGroup(job, options);
          break;
        }
      case 'message-get':
        {
          context = this.createContextForQueueGet(job, options);
          break;
        }
      case 'state-create':
        {
          const messageJob = {
            nature: {
              type: 'message',
              quality: 'produce',
            },
            payload: job,
          };
          messageJob.payload.ip = Utils.ip;
          messageJob.payload.hostname = Utils.hostname;
          messageJob.payload.timestamp = Date.now();
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
   * createContext submethod for execution commandline and cancelation job
   * @param {Job} job - the Job to send
   * @param {Object} [options] - optional arguments
   * @returns {Context} the created context
   */
  createContextForCommandline(job) {
    const that = this;
    this.runningJobs.set(job.id, job);
    const context = that.cementHelper.createContext(job);
    context.once('accept', function onContextAccept(who) {
      that.send({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          jobid: job.id,
          state: 'running',
          message: `Job ${job.id} accepted by ${who}.`,
        },
      });
      that.ack(job);
    })
      .once('reject', function onContextReject(who, reject) {
        that.send({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            jobid: job.id,
            state: 'finished',
            error: reject,
            message: reject.message,
          },
        });
        that.ack(job);
        that.remove(job.id);
      })
      .once('done', function onContextDone(who, res) {
        that.send({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            jobid: job.id,
            state: res.state,
            message: res.message,
          },
        });
        that.remove(job.id);
        if (that.runningJobs.has(job.payload.groupjobid)) {
          if (res.hasOwnProperty('cancelMode') && res.cancelMode === 'MANUAL') {
            that.terminateGroupJob(job.payload.groupjobid, {
              nature: {
                type: 'state',
                quality: 'create',
              },
              payload: {
                jobid: job.payload.groupjobid,
                state: 'canceled',
                message: `group Job ${job.payload.groupjobid} canceled (MANUAL) during sub-Job ${job.id}`,
              },
            });
          } else {
            const groupJob = that.runningJobs.get(job.payload.groupjobid);
            that.send({
              nature: {
                type: 'message',
                quality: 'get',
              },
              payload: {
                groupjobid: groupJob.id,
                queue: groupJob.payload.queue,
              },
            });
          }
        }
      })
      .once('error', function onContextError(who, err) {
        that.send({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            jobid: job.id,
            state: 'finished',
            error: err,
            message: err.message,
          },
        });
        that.remove(job.id);
        if (that.runningJobs.has(job.payload.groupjobid)) {
          const groupJob = that.runningJobs.get(job.payload.groupjobid);
          that.send({
            nature: {
              type: 'message',
              quality: 'get',
            },
            payload: {
              groupjobid: groupJob.id,
              queue: groupJob.payload.queue,
            },
          });
        }
      });
    return context;
  }

  /**
   * createContext submethod for execution group job
   * @param {Job} job - the Job to send
   * @param {Object} [options] - optional arguments
   * @returns {Context} the created context
   */
  createContextForGroup(job) {
    const that = this;
    that.runningJobs.set(job.id, job);
    const context = that.createContextForQueueGet({
      nature: {
        type: 'message',
        quality: 'get',
      },
      payload: {
        groupjobid: job.id,
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
  createContextForQueueGet(job, options) {
    const that = this;
    const context = that.cementHelper.createContext(job);
    context.once('accept', function onContextAccept(who) {
      if (job.payload.hasOwnProperty('groupjobid') && (options && options.first)) {
        that.send({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            jobid: job.payload.groupjobid,
            state: 'running',
            message: `GET message request for group Job ${job.payload.groupjobid} accepted by ${who}.`,
          },
        });
      }
    }).once('reject', function onContextReject(who, reject) {
      if (job.payload.hasOwnProperty('groupjobid')) {
        that.terminateGroupJob(job.payload.groupjobid, {
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            jobid: job.payload.groupjobid,
            state: 'acked',
            message: `message-get job was rejected by ${who} with: ${reject.message}.`,
            error: reject,
          },
        });
      }
    }).once('done', function onContextDone(who, noMoreMessage) {
      if (noMoreMessage && job.payload.hasOwnProperty('groupjobid')) {
        that.terminateGroupJob(job.payload.groupjobid, {
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            jobid: job.payload.groupjobid,
            state: (options && options.first) ? 'acked' : 'finished',
            message: `No more Jobs to run for group Job ${job.payload.groupjobid}.`,
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
   * @param {ObjectId|String} groupjobid - the id of the group Job  to terminate
   * @param {Job} [create] - an optional execution-create to send
   * @private
   */
  terminateGroupJob(groupjobid, create) {
    if (this.runningJobs.has(groupjobid)) {
      const groupjob = this.runningJobs.get(groupjobid);
      this.ack(groupjob);
      if (create) {
        this.send(create);
      }
      this.remove(groupjob.id);
    }
  }

  /**
   * process sub-method for default case (execution-commandline, execution-group)
   * @param {Job} job - the job to process
   */
  processDefault(job) {
    if (this.runningJobs.size !== 0) {
      if (job.payload.priority === 0 || this.runningJobs.has(job.payload.groupjobid)) {
        this.send(job);
      } else {
        try {
          this.queue.queue(job);
          this.logger.info(`${this.cementHelper.brickName}: job ${job.id} has been queued.`);
        } catch (error) {
          this.send({
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              jobid: job.id,
              state: 'finished',
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
    if (this.runningJobs.has(cancelationJob.payload.jobid)) {
      const jobToCancel = this.runningJobs.get(cancelationJob.payload.jobid);
      const typeAndQuality =
        (`${jobToCancel.nature.type}-${jobToCancel.nature.quality}`).toLowerCase();
      switch (typeAndQuality) {
        case 'execution-group': {
          this.cancelGroupJob(cancelationJob, jobToCancel);
          break;
        }
        case 'execution-commandline':
        default: {
          this.send(cancelationJob);
          break;
        }
      }
    } else {
      this.cancelQueuedJob(cancelationJob);
    }
  }

  /**
   * cancel sub-method for canceling all sub jobs of a Group job
   * @param {job} cancelationJob - the Cancelation Job
   * @param {job} groupJob - the Group job to be canceled
   */
  cancelGroupJob(cancelationJob, groupJob) {
    const that = this;
    this.runningJobs.set(cancelationJob.id, cancelationJob);
    this.send({
      nature: {
        type: 'state',
        quality: 'create',
      },
      payload: {
        jobid: cancelationJob.id,
        state: 'running',
        message: `Job ${cancelationJob.id} accepted by ${this.cementHelper.brickName}`,
      },
    });
    const runningSubJobs = Array.from(this.runningJobs.values())
      .filter((runningJob) => (runningJob.payload.groupjobid === groupJob.id));
    if (runningSubJobs.length > 0) {
      runningSubJobs.forEach((subJob) => {
        const cancelSubJob = {
          id: new ObjectID(),
          nature: {
            type: 'execution',
            quality: 'cancelation',
          },
          payload: {
            jobid: subJob.id,
          },
        };
        this.send(cancelSubJob)
          .once('accept', function onAcceptJobDone() {
            that.ack(cancelationJob);
          })
          .once('reject', function onRejectJobDone(who, error) {
            that.remove(cancelationJob.id);
            that.send({
              nature: {
                type: 'state',
                quality: 'create',
              },
              payload: {
                jobid: cancelationJob.id,
                state: 'finished',
                message: `group Job ${cancelationJob.payload.jobid} canceled (MANUAL) with rejection error ${error}`,
                error: error,
              },
            });
            that.ack(cancelationJob);
          })
          .once('done', function onCancelJobDone() {
            that.remove(cancelationJob.id);
            that.send({
              nature: {
                type: 'state',
                quality: 'create',
              },
              payload: {
                jobid: cancelationJob.id,
                state: 'finished',
                message: `group Job ${cancelationJob.payload.jobid} canceled (MANUAL).`,
              },
            });
          })
          .once('error', function onCancelJobDone(who, error) {
            that.remove(cancelationJob.id);
            that.send({
              nature: {
                type: 'state',
                quality: 'create',
              },
              payload: {
                jobid: cancelationJob.id,
                state: 'finished',
                message: `group Job ${cancelationJob.payload.jobid} canceled (MANUAL) with error ${error}`,
                error: error,
              },
            });
          });
      });
    } else {
      this.remove(cancelationJob.id);
      this.send({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          jobid: cancelationJob.id,
          state: 'finished',
          message: `group Job ${cancelationJob.payload.jobid} canceled (MANUAL).`,
        },
      });
      this.ack(cancelationJob);
    }
  }

  /**
   * cancel sub-method for canceling queued job
   * @param {Job} cancelationJob - the Cancelation job
   */
  cancelQueuedJob(cancelationJob) {
    const dequeued = this.queue.remove(cancelationJob.payload.jobid);
    if (dequeued) {
      this.send({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          jobid: cancelationJob.payload.jobid,
          state: 'canceled',
          message: `Job ${cancelationJob.payload.jobid} removed from queue successfully.`,
        },
      });
      this.ack(dequeued);
      this.send({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          jobid: cancelationJob.id,
          state: 'finished',
          message: `Job ${cancelationJob.payload.jobid} removed from queue successfully.`,
        },
      });
      this.ack(cancelationJob);
    } else {
      this.send({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          jobid: cancelationJob.id,
          state: 'finished',
          message: `Job ${cancelationJob.payload.jobid} neither running nor queued. Nothing to cancel.`,
        },
      });
      this.ack(cancelationJob);
    }
  }
}

module.exports = JobBrokerHelper;
