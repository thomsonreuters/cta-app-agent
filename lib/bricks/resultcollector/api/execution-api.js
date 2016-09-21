'use strict';
const ResultCollector = require('./../resultcollector.js');
const utils = require('../utils.js');

class ExecutionApi {

  /**
   *
   * @param payload
   * @returns {Promise.<{nature: {type: string, quality: string}, payload: *}>}
   */
  changestate(payload) {
    if (payload.state === 'RUNNING') {
      ResultCollector.addRunningJobId(payload.jobid);
      payload.ids = Array.from(ResultCollector.getRunningJobIds());
    } else if (payload.state === 'CANCELLED'
      || payload.state === 'CANCELED'
      || payload.state === 'FINISHED'
      || payload.state === 'ACKED') {
      payload.ids = Array.from(ResultCollector.getRunningJobIds());
      ResultCollector.deleteRunningJobId(payload.jobid);
    }
    payload.hostname = utils.hostname;
    payload.ip = utils.ip;
    payload.timestamp = new Date().getTime();
    const job = {
      nature: {
        type: 'execution',
        quality: 'Result',
      },
      payload: payload,
    };
    return Promise.resolve(job);
  }

  attachLog(payload) {
    const job = {
      nature: {
        type: 'execution',
        quality: 'Result',
      },
      payload: {
        jobid: payload.jobid,
        log: {
          filepath: payload.filepath,
        },
      },
    };
    return Promise.resolve(job);
  }
}

module.exports = ExecutionApi;
