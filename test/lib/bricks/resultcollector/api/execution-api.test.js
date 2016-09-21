'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const chai = require('chai');
const expect = chai.expect;
const utils = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'utils.js'));
const ResultCollector = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'resultcollector.js'));

const resultCollector = new ResultCollector({}, {name: 'Result Collector'});
const runningJobId = 123;
const changeStateToRunningInput = {
  nature: {
    type: 'execution',
    quality: 'changestate',
  },
  payload: {
    jobid: runningJobId,
    state: 'RUNNING',
    customParam: 'foo bar',
  },
};
const changeStateToRunningOutput = {
  nature: {
    type: 'execution',
    quality: 'Result',
  },
  payload: {
    jobid: runningJobId,
    ids: [ runningJobId ],
    state: 'RUNNING',
    customParam: 'foo bar',
  },
};
const changeStateToCanceledInput = {
  nature: {
    type: 'execution',
    quality: 'changestate',
  },
  payload: {
    jobid: runningJobId,
    state: 'CANCELLED',
    customParam: 'foo bar',
  },
};
const changeStateToCanceledOutput = {
  nature: {
    type: 'execution',
    quality: 'Result',
  },
  payload: {
    jobid: runningJobId,
    ids: [ runningJobId ],
    state: 'CANCELLED',
    customParam: 'foo bar',
  },
};
const missingJobIdInput = {
  nature: {
    type: 'execution',
    quality: 'changestate',
  },
  payload: {
    state: 'CANCELLED',
    customParam: 'foo bar',
  },
};

describe('Execution API', function() {
  it('should update job running id', function() {
    expect(ResultCollector.getRunningJobIds().has(runningJobId)).to.be.equal(false);
    return resultCollector.doJob(changeStateToRunningInput).then(function(output) {
      expect(ResultCollector.getRunningJobIds().has(runningJobId)).to.be.equal(true);

      expect(output.payload.ip).to.be.equals(utils.ip);
      expect(output.payload.hostname).to.be.equals(utils.hostname);
      expect(output.payload.timestamp).to.not.be.undefined;
      delete output.payload.ip;
      delete output.payload.hostname;
      delete output.payload.timestamp;

      expect(output).deep.equals(changeStateToRunningOutput);
    });
  });

  it('should return canceled state', function() {
    expect(ResultCollector.getRunningJobIds().has(runningJobId)).to.be.equal(true);
    return resultCollector.doJob(changeStateToCanceledInput).then(function(output) {
      expect(ResultCollector.getRunningJobIds().has(runningJobId)).to.be.equal(false);


      expect(output.payload.ip).to.be.equals(utils.ip);
      expect(output.payload.hostname).to.be.equals(utils.hostname);
      expect(output.payload.timestamp).to.not.be.undefined;
      delete output.payload.ip;
      delete output.payload.hostname;
      delete output.payload.timestamp;

      expect(output).deep.equals(changeStateToCanceledOutput);
    });
  });

  it('should reject missing/incorrect jobid for type execution error', function() {
    const context = { data: missingJobIdInput };
    return resultCollector.validate(context).then(function() {
      expect.fail();
    }, function(err) {
      expect(err.message).equals(`missing/incorrect 'jobid' for type execution`);
    });
  });
});
