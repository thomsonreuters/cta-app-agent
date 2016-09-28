'use strict';
const appRootPath = require('app-root-path').path;
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

describe('JobBroker - JobBrokerHelper - cancel', function() {
  let jobBrokerHelper;
  const runningJobs = new Map();
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
    const job = {
      id: new ObjectID(),
      nature: {
        type: 'execution',
        quality: 'cancelation',
      },
      payload: {
        jobid: new ObjectID(),
      },
    };
    before(function() {
      sinon.stub(jobBrokerHelper.runningJobs, 'has').withArgs(job.payload.jobid).returns(false);
      sinon.stub(jobBrokerHelper, 'cancelQueuedJob');
      jobBrokerHelper.cancel(job);
    });
    after(function() {
      jobBrokerHelper.runningJobs.has.restore();
      jobBrokerHelper.cancelQueuedJob.restore();
    });

    it('should call cancelQueuedJob method', function() {
      expect(jobBrokerHelper.cancelQueuedJob.calledWithExactly(job)).to.equal(true);
    });
  });

  context('when job to cancel is running', function() {
    context('when job is execution-group', function() {
      const jobToCancel = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'group',
        },
        payload: {},
      };
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'cancelation',
        },
        payload: {
          jobid: jobToCancel.id,
        },
      };
      before(function() {
        sinon.stub(jobBrokerHelper.runningJobs, 'has').withArgs(job.payload.jobid).returns(true);
        sinon.stub(jobBrokerHelper.runningJobs, 'get').withArgs(job.payload.jobid).returns(jobToCancel);
        sinon.stub(jobBrokerHelper, 'cancelGroupJob');
        jobBrokerHelper.cancel(job);
      });
      after(function() {
        jobBrokerHelper.runningJobs.has.restore();
        jobBrokerHelper.runningJobs.get.restore();
        jobBrokerHelper.cancelGroupJob.restore();
      });

      it('should call cancelGroupJob method', function() {
        expect(jobBrokerHelper.cancelGroupJob.calledWithExactly(job, jobToCancel)).to.equal(true);
      });
    });

    context('when job is execution-commandLine', function() {
      const jobToCancel = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {},
      };
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'cancelation',
        },
        payload: {
          jobid: jobToCancel.id,
        },
      };
      before(function() {
        sinon.stub(jobBrokerHelper.runningJobs, 'has').withArgs(job.payload.jobid).returns(true);
        sinon.stub(jobBrokerHelper.runningJobs, 'get').withArgs(job.payload.jobid).returns(jobToCancel);
        sinon.stub(jobBrokerHelper, 'send');
        jobBrokerHelper.cancel(job);
      });
      after(function() {
        jobBrokerHelper.runningJobs.has.restore();
        jobBrokerHelper.runningJobs.get.restore();
        jobBrokerHelper.send.restore();
      });

      it('should send cancelation job', function() {
        expect(jobBrokerHelper.send.calledWithExactly(job)).to.equal(true);
      });
    });
  });
});
