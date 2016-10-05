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
const RunJob = require('./jobbrokerhelper.execution.run.testdata.js');
const ReadJob = require('./jobbrokerhelper.execution.read.testdata.js');

describe('JobBroker - JobBrokerHelper - processDefault', function() {
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
  context('when no job is running', function() {
    const job = new RunJob();
    before(function() {
      sinon.stub(jobBrokerHelper, 'send');
      jobBrokerHelper.runningJobs.run.clear();
      jobBrokerHelper.runningJobs.read.clear();
      jobBrokerHelper.runningJobs.cancel.clear();
      jobBrokerHelper.processDefault(job);
    });
    after(function() {
      jobBrokerHelper.send.restore();
    });
    it('should send the job', function() {
      expect(jobBrokerHelper.send.calledWithExactly(job)).to.equal(true);
    });
  });

  context('when job(s) is already running', function() {
    context('when job priority is zero', function() {
      const job = new RunJob(0);
      const runningJob = new RunJob(1);
      before(function() {
        sinon.stub(jobBrokerHelper, 'send');
        jobBrokerHelper.runningJobs.run.set(runningJob.payload.execution.id, runningJob);
        jobBrokerHelper.processDefault(job);
      });
      after(function() {
        jobBrokerHelper.send.restore();
        jobBrokerHelper.runningJobs.run.clear();
      });
      it('should send the job', function() {
        expect(jobBrokerHelper.send.calledWithExactly(job)).to.equal(true);
      });
    });

    context('when job belongs to a running group job', function() {
      const runningJob = new ReadJob();
      const job = new RunJob();
      job.payload.execution.id = runningJob.payload.execution.id;
      before(function() {
        sinon.stub(jobBrokerHelper, 'send');
        jobBrokerHelper.runningJobs.read.set(runningJob.payload.execution.id, runningJob);
        jobBrokerHelper.processDefault(job);
      });
      after(function() {
        jobBrokerHelper.send.restore();
        jobBrokerHelper.runningJobs.read.clear();
      });
      it('should send the job', function() {
        expect(jobBrokerHelper.send.calledWithExactly(job)).to.equal(true);
      });
    });

    context('when job priority is not zero and does not belong to a running group job', function() {
      context('when queuing the job succeeds', function() {
        const job = new RunJob();
        const runningJob = new RunJob();
        before(function() {
          sinon.stub(jobBrokerHelper.queue, 'queue');
          sinon.stub(jobBrokerHelper.logger, 'info');
          jobBrokerHelper.runningJobs.run.set(runningJob.payload.execution.id, runningJob);
          jobBrokerHelper.processDefault(job);
        });
        after(function() {
          jobBrokerHelper.queue.queue.restore();
          jobBrokerHelper.logger.info.restore();
          jobBrokerHelper.runningJobs.run.clear();
        });
        it('should queue the job', function() {
          expect(jobBrokerHelper.queue.queue.calledWithExactly(job)).to.equal(true);
        });
        it('should log info that job was queued', function() {
          const message = `Execution: ${job.payload.execution.id} - State: queued`;
          expect(jobBrokerHelper.logger.info.calledWithExactly(message)).to.equal(true);
        });
      });

      context('when queuing the job fails', function() {
        const job = new RunJob();
        const runningJob = new RunJob();
        const queueError = new Error('mock queue error');
        before(function() {
          sinon.stub(jobBrokerHelper.queue, 'queue').throws(queueError);
          sinon.stub(jobBrokerHelper, 'send');
          sinon.stub(jobBrokerHelper, 'ack');
          jobBrokerHelper.runningJobs.run.set(runningJob.payload.execution.id, runningJob);
          jobBrokerHelper.processDefault(job);
        });
        after(function() {
          jobBrokerHelper.queue.queue.restore();
          jobBrokerHelper.send.restore();
          jobBrokerHelper.ack.restore();
          jobBrokerHelper.runningJobs.run.clear();
        });
        it('should send finished state', function() {
          const stateJob = {
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: job.payload.execution.id,
              status: 'finished',
              error: queueError,
              message: queueError.message,
            },
          };
          sinon.assert.calledWith(jobBrokerHelper.send, stateJob);
        });
        it('should ack the job', function() {
          sinon.assert.calledWith(jobBrokerHelper.ack, job);
        });
      });
    });
  });
});
