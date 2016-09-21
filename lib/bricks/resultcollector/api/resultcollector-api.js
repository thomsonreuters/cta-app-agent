'use strict';
const ResultCollector = require('../resultcollector.js');

class ResultCollectorApi {

  /**
   * Get all running jobids
   * @param payload
   * @returns {Promise.<{nature: {type: string, quality: string}, payload: {runningJobsIds: array}}>} Return CTA job with 'resultcollector' type and 'result' quality
   */
  getRunningJobId(payload) {
    payload.runningJobsIds = Array.from(ResultCollector.getRunningJobIds());
    const job = {
      nature: {
        type: 'ResultCollector',
        quality: 'Result',
      },
      payload: payload,
    };
    return Promise.resolve(job);
  }
}

module.exports = ResultCollectorApi;
