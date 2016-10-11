'use strict';
const co = require('co');
const ObjectID = require('bson').ObjectID;
const Brick = require('cta-brick');
const JobHandlerHelper = require('./jobhandlerhelper');
const executors = {
  CommandLine: require('./executor/commandline'), // eslint-disable-line global-require
};

/**
 * JobHandler class
 * @class
 * @extends Brick
 * @property {Map<Executor>} executors - A Map of all the Executors available
 * @property {Map<Job>} runningJobs - A Map of all the Jobs being run by this JobHandler
 * @property {JobHandlerHelper} jobHandlerHelper - An instance of JobHandlerHelper
 */
class JobHandler extends Brick {
  /**
   * Create a new JobHandler instance
   * @param {CementHelper} cementHelper - cementHelper instance
   * @param {Object} config - cement configuration of the brick
   */
  constructor(cementHelper, config) {
    super(cementHelper, config);
    this.executors = new Map();
    this.executors.set('commandLine',
      new executors.CommandLine(config.properties.COMMANDLINE, this.logger));
    this.runningJobs = new Map();
    this.jobHandlerHelper = new JobHandlerHelper(this.executors, this.runningJobs);
  }

  /**
   * Validates Job properties
   * @param {Context} context - a Context
   * @returns {Promise}
   */
  validate(context) {
    const job = context.data;
    const that = this;
    const superValidate = super.validate.bind(this);

    return co(function* validateCoroutine() {
      yield superValidate(context);
      if (!job.hasOwnProperty('id') || !(ObjectID.isValid(job.id))) {
        throw (new Error('missing/incorrect \'id\' ObjectID property in job'));
      }

      const type = job.nature.type;
      if (type !== 'execution') {
        throw (new Error(`type ${job.nature.type} not supported`));
      }

      const quality = job.nature.quality;
      if (!that.executors.has(quality) && quality !== 'cancelation') {
        throw (new Error(`quality ${job.nature.quality} not supported`));
      }

      if (quality === 'cancelation') {
        if (!job.payload.hasOwnProperty('jobid') || !(ObjectID.isValid(job.payload.jobid))) {
          throw (new Error('missing/incorrect \'jobid\' ObjectID property in job payload'));
        }
      } else {
        yield that.executors.get(quality).validate(job);
      }
      return { ok: 1 };
    });
  }

  /**
   * Process the context, emit events, create new context and define listeners
   * @param context
   */
  process(context) {
    const that = this;
    const job = context.data;
    if (job.nature.quality === 'cancelation' && !this.runningJobs.has(job.payload.jobid)) {
      context.emit('done', that.name, {
        ok: 1,
        state: 'finished',
        message: `Cancelation job ${job.id} tried to cancel job ${job.payload.jobid} but it wasn't running.`,
      });
    } else {
      const executor = that.jobHandlerHelper.getExecutor(job);
      that.jobHandlerHelper.runExecutor(executor, job, function onJobFinished(err, finishResponse) {
        if (err) {
          context.emit('error', that.name, err);
        } else if (finishResponse.hasOwnProperty('cancelMode')) {
          // && finishResponse.cancelMode === 'manual') {
          context.emit('canceled', that.name, finishResponse);
        } else {
          context.emit('done', that.name, finishResponse);
        }
      }).then(function onJobStarted(startResponse) {
        context.emit('progress', that.name, startResponse);
      }).catch(function onJobFailed(err) {
        context.emit('error', that.name, err);
      });
    }
  }
}

/**
 * @typedef {Object} Job
 * @property {String} id - id of the job
 * @property {Object} nature - nature description of the job
 * @property {String} nature.quality - quality of the job
 * @property {String} nature.type - type of the job
 * @property {Object} payload - payload of the job
 */
exports = module.exports = JobHandler;
