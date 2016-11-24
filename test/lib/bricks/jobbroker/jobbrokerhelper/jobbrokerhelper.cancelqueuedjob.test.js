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
const CancelJob = require('./jobbrokerhelper.execution.cancel.testdata.js');

describe('JobBroker - JobBrokerHelper - cancelQueuedJob', function() {
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
  context('when job was successfully removed from queue (pendingTimeout)', function() {
    const jobToCancel = new RunJob();
    const job = new CancelJob(jobToCancel.payload.execution.id);
    job.payload.mode = 'pendingTimeout';
    before(function() {
      sinon.stub(jobBrokerHelper.queue, 'remove').withArgs(job.payload.execution.id).returns(jobToCancel);
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper, 'ack');
      jobBrokerHelper.cancelQueuedJob(job);
    });
    after(function() {
      jobBrokerHelper.queue.remove.restore();
      jobBrokerHelper.send.restore();
      jobBrokerHelper.ack.restore();
    });

    it('should send canceled state for the canceled job', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          executionId: job.payload.execution.id,
          status: 'timeout',
          message: 'Job Pending Timeout exceeded.',
        },
      })).to.equal(true);
    });

    it('should ack the canceled job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(jobToCancel)).to.equal(true);
    });

    it('should ack the cancelation job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.equal(true);
    });
  });

  context('when job was successfully removed from queue (manual)', function() {
    const jobToCancel = new RunJob();
    const job = new CancelJob(jobToCancel.payload.execution.id);
    before(function() {
      sinon.stub(jobBrokerHelper.queue, 'remove').withArgs(job.payload.execution.id).returns(jobToCancel);
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper, 'ack');
      jobBrokerHelper.cancelQueuedJob(job);
    });
    after(function() {
      jobBrokerHelper.queue.remove.restore();
      jobBrokerHelper.send.restore();
      jobBrokerHelper.ack.restore();
    });

    it('should send canceled state for the canceled job', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          executionId: job.payload.execution.id,
          status: 'canceled',
          message: 'Job removed from queue successfully.',
        },
      })).to.equal(true);
    });

    it('should ack the canceled job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(jobToCancel)).to.equal(true);
    });

    it('should ack the cancelation job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.equal(true);
    });
  });

  context('when no job was not removed from queue (not present)', function() {
    const job = new CancelJob((new ObjectID()).toString());
    before(function() {
      sinon.stub(jobBrokerHelper.queue, 'remove').withArgs(job.payload.execution.id).returns(undefined);
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper, 'ack');
      jobBrokerHelper.cancelQueuedJob(job);
    });
    after(function() {
      jobBrokerHelper.queue.remove.restore();
      jobBrokerHelper.send.restore();
      jobBrokerHelper.ack.restore();
    });

    it('should ack the cancelation job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.equal(true);
    });
  });
});
