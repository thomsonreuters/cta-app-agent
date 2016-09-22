'use strict';
const ResultCollector = require('./../resultcollector.js');
const extend = require('util')._extend;
const utils = require('../utils.js');

class StepStatusApi {

  constructor(properties) {
    this.properties = properties;
  }

  /**
   * Submit step status
   * @param payload - See https://git.sami.int.thomsonreuters.com/compass/cta-resultcollector#submit-step-status
   * @returns {Promise.<{nature: {type: string, quality: string}, payload: {stepStatus}}>} Return CTA job with 'stepstatus' type and 'result' quality
   */
  collect(payload) {
    const stepStatus = extend({}, payload);
    stepStatus.ids = Array.from(ResultCollector.getRunningJobIds());
    stepStatus.hostname = utils.hostname;
    stepStatus.ip = utils.ip;
    stepStatus.timestamp = new Date().getTime();
    // testStatus.duration = 100;

    const job = {
      nature: {
        type: 'stepstatus',
        quality: 'result',
      },
      payload: {
        stepStatus: stepStatus,
      },
    };

    return Promise.resolve(job);
  }
}

module.exports = StepStatusApi;
