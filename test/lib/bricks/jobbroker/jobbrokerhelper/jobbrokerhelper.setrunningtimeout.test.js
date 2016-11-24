'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const sinon = require('sinon');
require('sinon-as-promised');

const JobBrokerHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobbrokerhelper.js'));
const JobQueue = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobqueue.js'));
const jobQueueOpts = require('./jobqueueopts.testdata.js');
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();
const RunJob = require('./jobbrokerhelper.execution.run.testdata.js');

describe('JobBroker - JobBrokerHelper - setPendingTimeout', function() {
  let clock;
  let jobBrokerHelper;
  before(function() {
    clock = sinon.useFakeTimers();
    const runningJobs = {
      run: new Map(),
      read: new Map(),
      cancel: new Map(),
    };
    const jobQueue = new JobQueue(jobQueueOpts);
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
    sinon.stub(jobBrokerHelper.logger, 'info');
    sinon.stub(jobBrokerHelper, 'cancel');
  });

  after(function() {
    clock.restore();
    jobBrokerHelper.logger.info.restore();
    jobBrokerHelper.cancel.restore();
  });

  it('should send cancelation job when runningTimeout is exceeded', function() {
    const job = new RunJob(null, 10000, null);
    const jobid = job.payload.execution.id;
    const timeout = job.payload.execution.runningTimeout;

    const cancelationJob = {
      nature: {
        type: 'execution',
        quality: 'cancel',
      },
      payload: {
        execution: {
          id: jobid,
        },
        mode: 'executionTimeout',
      },
    };

    jobBrokerHelper.setRunningTimeout(job);

    clock.tick(timeout - 10);
    sinon.assert.notCalled(jobBrokerHelper.logger.info);
    sinon.assert.notCalled(jobBrokerHelper.cancel);

    clock.tick(10);
    sinon.assert.calledWithExactly(
      jobBrokerHelper.logger.info,
      `Job Running Timeout exceeded for Job ${jobid}`
    );
    sinon.assert.calledWithExactly(jobBrokerHelper.cancel, cancelationJob);
  });
});
