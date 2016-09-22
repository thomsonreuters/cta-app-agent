'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const chai = require('chai');
const expect = chai.expect;
const ResultCollector = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'resultcollector.js'));

const runningJobId = 123;
const getRunningJobIdInput = {
  nature: {
    type: 'resultcollector',
    quality: 'getrunningjobid',
  },
  payload: {
    customParam: 'foo bar',
  },
};

describe('Result Collector API', function() {
  it('should return running jobid', function(done) {
    const resultCollector = new ResultCollector({}, {name: 'Result Collector'});
    ResultCollector.addRunningJobId(runningJobId);

    resultCollector.doJob(getRunningJobIdInput).then(function(output) {
      expect(output).deep.equals({
        nature: {
          type: 'resultcollector',
          quality: 'result',
        },
        payload: {
          runningJobsIds: [ runningJobId ],
          customParam: 'foo bar',
        },
      });
      done();
    });
  });
});
