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

describe('JobBroker - JobBrokerHelper - cancelQueuedJob', function() {
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
  context('when job was successfully removed from queue', function() {
    const jobToCancel = {
      id: new ObjectID(),
      nature: {
        type: 'execution',
        quality: 'commandline',
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
      sinon.stub(jobBrokerHelper.queue, 'remove').withArgs(job.payload.jobid).returns(jobToCancel);
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper, 'ack');
      jobBrokerHelper.cancelQueuedJob(job);
    });
    after(function() {
      jobBrokerHelper.queue.remove.restore();
      jobBrokerHelper.send.restore();
      jobBrokerHelper.ack.restore();
    });

    it('should send canceled changestate for the canceled job', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'execution',
          quality: 'changestate',
        },
        payload: {
          jobid: job.payload.jobid,
          state: 'canceled',
          message: `Job ${job.payload.jobid} removed from queue successfully.`,
        },
      })).to.equal(true);
    });

    it('should ack the canceled job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(jobToCancel)).to.equal(true);
    });

    it('should send finished changestate for the cancelation job', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'execution',
          quality: 'changestate',
        },
        payload: {
          jobid: job.id,
          state: 'finished',
          message: `Job ${job.payload.jobid} removed from queue successfully.`,
        },
      })).to.equal(true);
    });

    it('should ack the cancelation job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.equal(true);
    });
  });

  context('when no job was not removed from queue (not present)', function() {
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
      sinon.stub(jobBrokerHelper.queue, 'remove').withArgs(job.payload.jobid).returns(undefined);
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper, 'ack');
      jobBrokerHelper.cancelQueuedJob(job);
    });
    after(function() {
      jobBrokerHelper.queue.remove.restore();
      jobBrokerHelper.send.restore();
      jobBrokerHelper.ack.restore();
    });

    it('should send finished changestate for the cancelation job', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'execution',
          quality: 'changestate',
        },
        payload: {
          jobid: job.id,
          state: 'finished',
          message: `Job ${job.payload.jobid} neither running nor queued. Nothing to cancel.`,
        },
      })).to.equal(true);
    });

    it('should ack the cancelation job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.equal(true);
    });
  });
});
