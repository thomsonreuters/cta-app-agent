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

  context('when job pendingTimestamp has been exceeded', function() {
    const now = Date.now();
    const job = new RunJob();
    job.payload.execution.pendingTimeout = 1000;
    job.payload.execution.requestTimestamp = now - (job.payload.execution.pendingTimeout + 1000);
    const runningJob = new RunJob();
    before(function() {
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper, 'ack');
      sinon.stub(jobBrokerHelper.logger, 'info');
      sinon.stub(Date, 'now').returns(now);
      jobBrokerHelper.runningJobs.run.set(runningJob.payload.execution.id, runningJob);
      jobBrokerHelper.processDefault(job);
    });
    after(function() {
      jobBrokerHelper.send.restore();
      jobBrokerHelper.ack.restore();
      jobBrokerHelper.logger.info.restore();
      Date.now.restore();
      jobBrokerHelper.runningJobs.run.clear();
    });
    it('should log info that job was canceled (pendingTimeout)', function() {
      const message = `Job Pending Timeout exceeded for Job ${job.payload.execution.id}`;
      expect(jobBrokerHelper.logger.info.calledWithExactly(message)).to.equal(true);
    });
    it('should send canceled state', function() {
      const stateJob = {
        nature: {
          type: 'states',
          quality: 'create',
        },
        payload: {
          executionId: job.payload.execution.id,
          status: 'timeout',
          message: 'Job Pending Timeout exceeded.',
        },
      };
      sinon.assert.calledWith(jobBrokerHelper.send, stateJob);
    });
    it('should ack the job', function() {
      sinon.assert.calledWith(jobBrokerHelper.ack, job);
    });
  });

  context('when no job is running', function() {
    const job = new RunJob();
    before(function() {
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper, 'setRunningTimeout');
      jobBrokerHelper.runningJobs.run.clear();
      jobBrokerHelper.runningJobs.read.clear();
      jobBrokerHelper.runningJobs.cancel.clear();
      jobBrokerHelper.processDefault(job);
    });
    after(function() {
      jobBrokerHelper.send.restore();
      jobBrokerHelper.setRunningTimeout.restore();
    });
    it('should send the job', function() {
      expect(jobBrokerHelper.send.calledWithExactly(job)).to.equal(true);
    });

    it('should set a running timeout for the job', function() {
      expect(jobBrokerHelper.setRunningTimeout.calledWithExactly(job)).to.equal(true);
    });
  });

  context('when job(s) is already running', function() {
    context('when job priority is zero', function() {
      const job = new RunJob(0);
      const runningJob = new RunJob(1);
      before(function() {
        sinon.stub(jobBrokerHelper, 'send');
        sinon.stub(jobBrokerHelper, 'setRunningTimeout');
        jobBrokerHelper.runningJobs.run.set(runningJob.payload.execution.id, runningJob);
        jobBrokerHelper.processDefault(job);
      });
      after(function() {
        jobBrokerHelper.send.restore();
        jobBrokerHelper.setRunningTimeout.restore();
        jobBrokerHelper.runningJobs.run.clear();
      });
      it('should send the job', function() {
        expect(jobBrokerHelper.send.calledWithExactly(job)).to.equal(true);
      });
      it('should set a running timeout for the job', function() {
        expect(jobBrokerHelper.setRunningTimeout.calledWithExactly(job)).to.equal(true);
      });
    });

    context('when job belongs to a running group job', function() {
      const runningJob = new ReadJob();
      const job = new RunJob();
      job.payload.execution.id = runningJob.payload.execution.id;
      before(function() {
        sinon.stub(jobBrokerHelper, 'send');
        sinon.stub(jobBrokerHelper, 'setRunningTimeout');
        jobBrokerHelper.runningJobs.read.set(runningJob.payload.execution.id, runningJob);
        jobBrokerHelper.processDefault(job);
      });
      after(function() {
        jobBrokerHelper.send.restore();
        jobBrokerHelper.setRunningTimeout.restore();
        jobBrokerHelper.runningJobs.read.clear();
      });
      it('should send the job', function() {
        expect(jobBrokerHelper.send.calledWithExactly(job)).to.equal(true);
      });
      it('should NOT set a running timeout for the job', function() {
        expect(jobBrokerHelper.setRunningTimeout.calledWithExactly(job)).to.equal(false);
      });
    });

    context('when job priority is not zero and does not belong to a running group job', function() {
      context('when queuing the job succeeds', function() {
        const job = new RunJob();
        const runningJob = new RunJob();
        before(function() {
          sinon.stub(jobBrokerHelper.queue, 'queue');
          sinon.stub(jobBrokerHelper.logger, 'info');
          sinon.stub(jobBrokerHelper, 'setPendingTimeout');
          jobBrokerHelper.runningJobs.run.set(runningJob.payload.execution.id, runningJob);
          jobBrokerHelper.processDefault(job);
        });
        after(function() {
          jobBrokerHelper.queue.queue.restore();
          jobBrokerHelper.logger.info.restore();
          jobBrokerHelper.setPendingTimeout.restore();
          jobBrokerHelper.runningJobs.run.clear();
        });
        it('should queue the job', function() {
          expect(jobBrokerHelper.queue.queue.calledWithExactly(job)).to.equal(true);
        });
        it('should log info that job was queued', function() {
          const message = `Execution: ${job.payload.execution.id} - State: queued`;
          expect(jobBrokerHelper.logger.info.calledWithExactly(message)).to.equal(true);
        });
        it('should set a pending timeout for the job', function() {
          expect(jobBrokerHelper.setPendingTimeout.calledWithExactly(job)).to.equal(true);
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
              type: 'states',
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
