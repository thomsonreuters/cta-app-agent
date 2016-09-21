'use strict';
const appRootPath = require('app-root-path').path;
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

describe('JobBroker - JobBrokerHelper - terminateGroupJob', function() {
  context('when terminating without a changeState job', function() {
    let jobBrokerHelper;
    const runningJobs = new Map();
    const jobQueue = new JobQueue(jobQueueOpts);
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    const job = {
      id: 'some-groupjob-id',
      nature: {
        type: 'execution',
        quality: 'group',
      },
      payload: {
        queue: 'some-queue',
      },
    };
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, 'ack');
      sinon.stub(jobBrokerHelper, 'remove');
      sinon.stub(jobBrokerHelper.runningJobs, 'has').withArgs(job.id).returns(true);
      sinon.stub(jobBrokerHelper.runningJobs, 'get').withArgs(job.id).returns(job);
      jobBrokerHelper.terminateGroupJob(job.id);
    });
    after(function() {
      jobBrokerHelper.ack.restore();
      jobBrokerHelper.remove.restore();
      jobBrokerHelper.runningJobs.has.restore();
      jobBrokerHelper.runningJobs.get.restore();
    });
    it('should call jobBrokerHelper ack with job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.equal(true);
    });

    it('should call jobBrokerHelper remove with job.id', function() {
      expect(jobBrokerHelper.remove.calledWithExactly(job.id)).to.equal(true);
    });
  });

  context('when terminating without a changestate job', function() {
    let jobBrokerHelper;
    const runningJobs = new Map();
    const jobQueue = new JobQueue(jobQueueOpts);
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    const job = {
      id: 'some-groupjob-id',
      nature: {
        type: 'execution',
        quality: 'group',
      },
      payload: {
        queue: 'some-queue',
      },
    };
    const changestateJob = {
      nature: {
        type: 'execution',
        quality: 'changestate',
      },
      payload: {},
    };
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, 'ack');
      sinon.stub(jobBrokerHelper, 'remove');
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper.runningJobs, 'has').withArgs(job.id).returns(true);
      sinon.stub(jobBrokerHelper.runningJobs, 'get').withArgs(job.id).returns(job);
      jobBrokerHelper.terminateGroupJob(job.id, changestateJob);
    });
    after(function() {
      jobBrokerHelper.ack.restore();
      jobBrokerHelper.remove.restore();
      jobBrokerHelper.send.restore();
      jobBrokerHelper.runningJobs.has.restore();
      jobBrokerHelper.runningJobs.get.restore();
    });
    it('should call jobBrokerHelper ack with job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.equal(true);
    });

    it('should call jobBrokerHelper remove with job.id', function() {
      expect(jobBrokerHelper.remove.calledWithExactly(job.id)).to.equal(true);
    });

    it('should call jobBrokerHelper send with changestate job', function() {
      expect(jobBrokerHelper.send.calledWithExactly(changestateJob)).to.equal(true);
    });
  });
});
