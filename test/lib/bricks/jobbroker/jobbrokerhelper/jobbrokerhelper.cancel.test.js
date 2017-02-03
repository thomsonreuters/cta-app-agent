'use strict';

const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');

const ObjectID = require('bson').ObjectID;

const JobBrokerHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobbrokerhelper.js'));
const JobQueue = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobqueue.js'));
const jobQueueOpts = require('./jobqueueopts.testdata.js');
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();
const RunJob = require('./jobbrokerhelper.execution.run.testdata.js');
const ReadJob = require('./jobbrokerhelper.execution.read.testdata.js');
const CancelJob = require('./jobbrokerhelper.execution.cancel.testdata.js');

describe('JobBroker - JobBrokerHelper - cancel', function() {
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
    brickName: 'jobbroker',
  };
  before(function() {
    jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
  });

  context('when job to cancel is not running', function() {
    const job = new CancelJob((new ObjectID()).toString());
    before(function() {
      sinon.stub(jobBrokerHelper.runningJobs.read, 'has').withArgs(job.payload.execution.id).returns(false);
      sinon.stub(jobBrokerHelper.runningJobs.run, 'has').withArgs(job.payload.execution.id).returns(false);
      sinon.stub(jobBrokerHelper, 'cancelQueuedJob');
      jobBrokerHelper.cancel(job);
    });
    after(function() {
      jobBrokerHelper.runningJobs.read.has.restore();
      jobBrokerHelper.runningJobs.run.has.restore();
      jobBrokerHelper.cancelQueuedJob.restore();
    });

    it('should call cancelQueuedJob method', function() {
      expect(jobBrokerHelper.cancelQueuedJob.calledWithExactly(job)).to.equal(true);
    });
  });

  context('when job to cancel is running', function() {
    context('when job is execution-read', function() {
      const jobToCancel = new ReadJob();
      const job = new CancelJob(jobToCancel.payload.execution.id);
      before(function() {
        sinon.stub(jobBrokerHelper.runningJobs.read, 'has').withArgs(job.payload.execution.id).returns(true);
        sinon.stub(jobBrokerHelper.runningJobs.read, 'get').withArgs(job.payload.execution.id).returns(jobToCancel);
        sinon.stub(jobBrokerHelper, 'send');
        jobBrokerHelper.cancel(job);
      });
      after(function() {
        jobBrokerHelper.runningJobs.read.has.restore();
        jobBrokerHelper.runningJobs.read.get.restore();
        jobBrokerHelper.send.restore();
      });

      it('should send cancelation job', function() {
        expect(jobBrokerHelper.send.calledWithExactly(job)).to.equal(true);
      });
    });

    context('when job is execution-run', function() {
      const jobToCancel = new RunJob();
      const job = new CancelJob(jobToCancel.payload.execution.id);
      before(function() {
        sinon.stub(jobBrokerHelper.runningJobs.read, 'has').withArgs(job.payload.execution.id).returns(false);
        sinon.stub(jobBrokerHelper.runningJobs.run, 'has').withArgs(job.payload.execution.id).returns(true);
        sinon.stub(jobBrokerHelper.runningJobs.run, 'get').withArgs(job.payload.execution.id).returns(jobToCancel);
        sinon.stub(jobBrokerHelper, 'send');
        jobBrokerHelper.cancel(job);
      });
      after(function() {
        jobBrokerHelper.runningJobs.read.has.restore();
        jobBrokerHelper.runningJobs.run.has.restore();
        jobBrokerHelper.runningJobs.run.get.restore();
        jobBrokerHelper.send.restore();
      });

      it('should send cancelation job', function() {
        expect(jobBrokerHelper.send.calledWithExactly(job)).to.equal(true);
      });
    });
  });
});
