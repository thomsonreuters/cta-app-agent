'use strict';
const ResultCollector = require('../resultcollector.js');

class ResultCollectorApi {

  /**
   * Get all running jobids
   * @param payload
   * @returns {Promise.<{nature: {type: string, quality: string}, payload: {runningJobsIds: array}}>} Return CTA job with 'resultcollector' type and 'result' quality
   */
  getrunningjobid(payload) {
    payload.runningJobsIds = Array.from(ResultCollector.getRunningJobIds());
    const job = {
      nature: {
        type: 'resultcollector',
        quality: 'result',
      },
      payload: payload,
    };
    return Promise.resolve(job);
  }
}

module.exports = ResultCollectorApi;
