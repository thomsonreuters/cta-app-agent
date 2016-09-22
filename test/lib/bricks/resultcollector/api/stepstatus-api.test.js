'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const utils = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'utils.js'));
const ResultCollector = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'resultcollector.js'));

const runningJobId = 123;
const stepStatusCollectInput = {
  nature: {
    type: 'stepstatus',
    quality: 'collect',
  },
  payload: {
    testName: 'Say Hello',
    stepName: 'Say Bonjour',
    status: 'failed',
    message: 'Hello not found',
    customParameter: 'blah',
  },
};
const stepStatusCollectOutput = {
  nature: {
    quality: 'result',
    type: 'stepstatus',
  },
  payload: {
    stepStatus: {
      testName: 'Say Hello',
      stepName: 'Say Bonjour',
      status: 'failed',
      message: 'Hello not found',
      customParameter: 'blah',
      ids: [ runningJobId ],
      ip: utils.ip,
      hostname: utils.hostname,
    },
  },
};

describe('Step Status API', function() {
  before(function() {
    this.resultCollector = new ResultCollector({}, {
      name: 'Result Collector',
    });
    ResultCollector.addRunningJobId(runningJobId);
  });

  it('should collect step status', function() {
    return this.resultCollector.doJob(stepStatusCollectInput).then(function(output) {
      expect(output.payload.stepStatus.timestamp).to.not.be.undefined;
      delete output.payload.stepStatus.timestamp;

      expect(output).deep.equal(stepStatusCollectOutput);
    });
  });
});