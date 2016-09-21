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
const testStatusCollectInput = {
  nature: {
    type: 'TestStatus',
    quality: 'collect',
  },
  payload: {
    testName: 'Say Hello',
    status: 'failed',
    message: 'Hello not found',
    customParameter: 'blah',
  },
};
const testStatusCollectOutput = {
  nature: {
    quality: 'Result',
    type: 'TestStatus',
  },
  payload: {
    testStatus: {
      testName: 'Say Hello',
      status: 'failed',
      message: 'Hello not found',
      customParameter: 'blah',
      ids: [ runningJobId ],
      ip: utils.ip,
      hostname: utils.hostname,
    },
  },
};
const testStatusCaptureInput = {
  nature: {
    type: 'TestStatus',
    quality: 'captureScreen',
  },
  payload: {
    testName: 'Say Hello',
    customParameter: 'blah',
  },
};
const testStatusCaptureOutput = {
  nature: {
    quality: 'Result',
    type: 'TestStatus',
  },
  payload: {
    ids: [ runningJobId ],
    testName: 'Say Hello',
    screenshot: {
      filepath: undefined,
    },
    customParameter: 'blah',
  },
};

describe('Test Status API', function() {
  before(function() {
    this.resultCollector = new ResultCollector({}, {
      name: 'Result Collector',
      properties: {
        screenshotDirectory: './temp',
      },
    });
    ResultCollector.addRunningJobId(runningJobId);
  });

  it('should collect test status', function() {
    return this.resultCollector.doJob(testStatusCollectInput).then(function(output) {
      expect(output.payload.testStatus.timestamp).to.not.be.undefined;
      delete output.payload.testStatus.timestamp;

      expect(output).deep.equal(testStatusCollectOutput);
    });
  });

  it('should capture screen on windows machine', function() {
    if (process.platform === 'win32') {
      let filepath = '';
      return this.resultCollector.doJob(testStatusCaptureInput).then(function (output) {
        expect(output.payload.screenshot.filepath).to.not.be.undefined;
        filepath = output.payload.screenshot.filepath;
        output.payload.screenshot.filepath = undefined;

        expect(output).deep.equal(testStatusCaptureOutput);

        fs.accessSync(filepath, fs.F_OK, function (fileError) {
          expect(fileError).to.be.null;
        });
      })
    }
  });

  it('should return error on linux machine', function() {
    if (process.platform !== 'win32') {
      return this.resultCollector.doJob(testStatusCaptureInput).then(function() {
        expect.fail('This should fail');
      }, function(err) {
        expect(err).equal('Screenshot is only supported on Windows');
      });
    }
  });
});
