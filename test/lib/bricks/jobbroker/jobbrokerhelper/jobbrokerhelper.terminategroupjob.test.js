'use strict';

const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');

const JobBrokerHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobbrokerhelper.js'));
const JobQueue = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobqueue.js'));
const jobQueueOpts = require('./jobqueueopts.testdata.js');
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();
const ReadJob = require('./jobbrokerhelper.execution.read.testdata.js');

describe('JobBroker - JobBrokerHelper - terminateGroupJob', function() {
  context('when terminating without a state-create job', function() {
    let jobBrokerHelper;
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
    const job = new ReadJob();
    const jobId = job.payload.execution.id;
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, 'ack');
      sinon.stub(jobBrokerHelper, 'remove');
      sinon.stub(jobBrokerHelper.runningJobs.read, 'has').withArgs(jobId).returns(true);
      sinon.stub(jobBrokerHelper.runningJobs.read, 'get').withArgs(jobId).returns(job);
      jobBrokerHelper.terminateGroupJob(jobId);
    });
    after(function() {
      jobBrokerHelper.ack.restore();
      jobBrokerHelper.remove.restore();
      jobBrokerHelper.runningJobs.read.has.restore();
      jobBrokerHelper.runningJobs.read.get.restore();
    });
    it('should call jobBrokerHelper ack with job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.equal(true);
    });

    it('should call jobBrokerHelper remove with job.id', function() {
      expect(jobBrokerHelper.remove.calledWithExactly(job)).to.equal(true);
    });
  });

  context('when terminating with a state-create job', function() {
    let jobBrokerHelper;
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
    const job = new ReadJob();
    const jobId = job.payload.execution.id;
    const changestateJob = {
      nature: {
        type: 'states',
        quality: 'create',
      },
      payload: {},
    };
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, 'ack');
      sinon.stub(jobBrokerHelper, 'remove');
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper.runningJobs.read, 'has').withArgs(jobId).returns(true);
      sinon.stub(jobBrokerHelper.runningJobs.read, 'get').withArgs(jobId).returns(job);
      jobBrokerHelper.terminateGroupJob(jobId, changestateJob);
    });
    after(function() {
      jobBrokerHelper.ack.restore();
      jobBrokerHelper.remove.restore();
      jobBrokerHelper.send.restore();
      jobBrokerHelper.runningJobs.read.has.restore();
      jobBrokerHelper.runningJobs.read.get.restore();
    });
    it('should call jobBrokerHelper ack with job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.equal(true);
    });

    it('should call jobBrokerHelper remove with job.id', function() {
      expect(jobBrokerHelper.remove.calledWithExactly(job)).to.equal(true);
    });

    it('should call jobBrokerHelper send with state job', function() {
      expect(jobBrokerHelper.send.calledWithExactly(changestateJob)).to.equal(true);
    });
  });
});
