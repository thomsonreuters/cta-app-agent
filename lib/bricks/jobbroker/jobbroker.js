'use strict';
const ObjectID = require('bson').ObjectID;
const Brick = require('cta-brick');
const JobBrokerHelper = require('./jobbrokerhelper.js');
const JobQueue = require('./jobqueue.js');

/**
 * JobBroker class
 * @class
 * @property {PriorityQueue} queue - PriorityQueue of Jobs
 * @property {Map<Job>} runningJobs - Array of Jobs being processed
 */
class JobBroker extends Brick {
  /**
   * Create a new JobBroker instance
   * @param {CementHelper} cementHelper - cementHelper instance
   * @param {Object} config - cement configuration of the brick
   */
  constructor(cementHelper, config) {
    super(cementHelper, config);
    const self = this;
    this.DEFAULTS = {
      priority: config.properties.priority || 2,
    };
    this.queue = new JobQueue(
      {
        comparator: function comparator(jobA, jobB) {
          const priorityA = (jobA.payload.hasOwnProperty('priority')) ? jobA.payload.priority : self.DEFAULTS.priority;
          const priorityB = (jobB.payload.hasOwnProperty('priority')) ? jobB.payload.priority : self.DEFAULTS.priority;
          if (priorityA === priorityB) return -1;
          return priorityA - priorityB;
        },
        strategy: JobQueue.ArrayStrategy,
      });
    this.runningJobs = new Map();
    this.jobBrokerHelper = new JobBrokerHelper(this.cementHelper, this.queue, this.runningJobs, this.logger);
  }

  /**
   * Validates Job properties
   * @param {Context} context - a Context
   * @returns {Promise}
   */
  validate(context) {
    const that = this;
    const job = context.data;
    return new Promise((resolve, reject) => {
      function rejectAndAck(error) {
        that.jobBrokerHelper.ack(job);
        that.jobBrokerHelper.send({
          nature: {
            type: 'execution',
            quality: 'changestate',
          },
          payload: {
            jobid: job.id,
            state: 'FINISHED',
            error: error,
            message: error.message,
          },
        });
        reject(error);
      }
      super.validate(context).then(() => {
        if (!job.hasOwnProperty('id') || !(ObjectID.isValid(job.id))) {
          rejectAndAck(new Error('missing/incorrect \'id\' ObjectID property in job'));
        }

        if (job.payload.hasOwnProperty('priority') && typeof job.payload.priority !== 'number') {
          rejectAndAck(new Error('incorrect \'priority\' number property in job payload'));
        }

        if (job.payload.hasOwnProperty('groupjobid') && !(ObjectID.isValid(job.payload.groupjobid))) {
          rejectAndAck(new Error('missing/incorrect \'groupjobid\' ObjectID property in job payload'));
        }

        if (job.nature.type.toLowerCase() === 'execution'
          && job.nature.quality.toLowerCase() === 'cancelation') {
          if (!job.payload.hasOwnProperty('jobid') || !(ObjectID.isValid(job.payload.jobid))) {
            rejectAndAck(new Error('missing/incorrect \'jobid\' ObjectID property in Cancelation job.payload'));
          }
        }

        if (job.nature.type.toLowerCase() === 'execution'
          && job.nature.quality.toLowerCase() === 'group') {
          if (!job.payload.hasOwnProperty('queue') || typeof job.payload.queue !== 'string') {
            rejectAndAck(new Error('missing/incorrect \'queue\' string property in group job.payload'));
          }
        }
        resolve({ok: 1});
      }).catch(rejectAndAck);
    });
  }

  /**
   * Process the context, emit events, create new context and define listeners
   * @param context
   */
  process(context) {
    const job = context.data;
    if (job.nature.type.toLowerCase() === 'execution') {
      switch (job.nature.quality.toLowerCase()) {
        case 'cancelation': {
          this.jobBrokerHelper.cancel(job);
          break;
        }
        case 'commandline':
        case 'group':
        default: {
          this.jobBrokerHelper.processDefault(job);
          break;
        }
      }
    }
  }
}

exports = module.exports = JobBroker;
