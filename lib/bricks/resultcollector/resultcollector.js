'use strict';
const Brick = require('cta-brick');

class ResultCollector extends Brick {

  constructor(cementHelper, config) {
    super(cementHelper, config);
    this.apis = {};
    ResultCollector.runningJobs = new Set();
    const that = this;
    //this.getApi('machine').description().then(function(description) {
    //  that.sendToDestination(description);
    //});
  }

  /**
   * Validates Job properties
   * @param {Context} context - a Context
   * @returns {Promise}
   */
  validate(context) {
    const job = context.data;
    return super.validate(context).then(function() {
      const type = job.nature.type.toLowerCase();
      const quality = job.nature.quality.toLowerCase();

      return new Promise(function(resolve, reject) {
        if (['execution', 'teststatus', 'stepstatus', 'resultcollector'].indexOf(type) === -1) {
          reject(new Error(`type ${type} not supported`));
        }
        if (type === 'execution') {
          if (['changestate', 'attachlog'].indexOf(quality) === -1) {
            reject(new Error(`quality ${quality} not supported for type execution`));
          }
          if (job.payload.jobid === undefined) {
            reject(new Error(`missing/incorrect 'jobid' for type execution`));
          }
        } else if (type === 'resultcollector') {
          if (['getrunningjobid'].indexOf(quality) === -1) {
            reject(new Error(`quality ${quality} not supported for type resultcollector`));
          }
        } else {
          if (['collect', 'capturescreen'].indexOf(quality) === -1) {
            reject(new Error(`quality ${quality} not supported for type teststatus`));
          }
        }
        resolve();
      });
    });
  }


  /**
   * Process the context, emit events, create new context and define listeners
   * @param context
   */
  process(context) {
    const that = this;
    const job = context.data;
    that.doJob(job).then(function(output) {
      context.emit('done', that.name, output);
      that.sendToDestination(output);
    }).catch(function(err) {
      context.emit('error', that.name, err);
    });
  }

  /**
   * Publish the job to other bricks
   * @param job
   */
  sendToDestination(data) {
    this.cementHelper.createContext(data).publish();
  }

  /**
   * Get the right api and execute the job
   * @param job
   * @returns {Promise} - Result of job
   */
  doJob(job) {
    const apiName = job.nature.type;
    const action = job.nature.quality;
    const api = this.getApi(apiName);
    if (api && api[action]) {
      return api[action](job.payload);
    }
    return Promise.reject(`Cannot find collector[${apiName}] action[${action}]`);
  }

  /**
   * Get the API handler
   * @param apiName
   * @returns {Object}
   */
  getApi(apiName) {
    apiName = apiName.toLowerCase();
    if (!this.apis[apiName]) {
      try {
        const Api = require(`./api/${apiName}-api.js`);
        this.apis[apiName] = new Api(this.properties, this.logger);
      } catch (err) {
        this.logger.error('Cannot find api', err);
      }
    }
    return this.apis[apiName];
  }

  /**
   * Add running jobid
   * @param jobid
   */
  static addRunningJobId(jobid) {
    ResultCollector.runningJobs.add(jobid);
    console.log('Running Jobs IDs (add): ', Array.from(ResultCollector.runningJobs));
  }

  /**
   * Delete running jobid
   * @param jobid
   */
  static deleteRunningJobId(jobid) {
    ResultCollector.runningJobs.delete(jobid);
    console.log('Running Jobs IDs (delete): ', Array.from(ResultCollector.runningJobs));
  }

  /**
   * Return all running jobids
   * @returns {Set} Set of string
   */
  static getRunningJobIds() {
    return ResultCollector.runningJobs;
  }
}

module.exports = ResultCollector;
