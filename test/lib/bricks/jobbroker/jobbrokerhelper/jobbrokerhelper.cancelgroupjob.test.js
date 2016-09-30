'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');

const EventEmitter = require('events').EventEmitter;
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

describe('JobBroker - JobBrokerHelper - cancelGroupJob', function() {
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

  context('when sub jobs of Group job are running', function() {
    const groupJob = new ReadJob();
    const subJobs = [
      {
        jobToCancel: new RunJob(),
      },
      {
        jobToCancel: new RunJob(),
      },
    ];
    subJobs.forEach(function(subJob) {
      subJob.jobToCancel.payload.groupExecutionId = groupJob.payload.execution.id;
    });
    const cancelationJob = new CancelJob(groupJob.payload.execution.id);
    before(function() {
      const sendStub = sinon.stub(jobBrokerHelper, 'send');
      subJobs.forEach((subJob) => {
        subJob.cancelationJob = new CancelJob(subJob.jobToCancel.payload.execution.id);
        subJob.cancelationContext = new EventEmitter();
        sinon.spy(subJob.cancelationContext, 'once');
        sendStub.withArgs(sinon.match(subJob.cancelationJob)).returns(subJob.cancelationContext);
        jobBrokerHelper.runningJobs.run.set(subJob.jobToCancel.payload.execution.id, subJob.jobToCancel);
      });
      jobBrokerHelper.runningJobs.read.set(groupJob.payload.execution.id, groupJob);
      sinon.stub(jobBrokerHelper.runningJobs.cancel, 'set');
      sinon.stub(jobBrokerHelper, 'remove');
      sinon.stub(jobBrokerHelper, 'ack');
      jobBrokerHelper.cancelGroupJob(cancelationJob, groupJob);
    });
    after(function() {
      jobBrokerHelper.runningJobs.read.clear();
      jobBrokerHelper.runningJobs.run.clear();
      jobBrokerHelper.runningJobs.cancel.set.restore();
      jobBrokerHelper.send.restore();
      jobBrokerHelper.remove.restore();
      jobBrokerHelper.ack.restore();
    });

    it('should add the cancelation job to the runningJobs cancel Map', function() {
      expect(jobBrokerHelper.runningJobs.cancel.set.calledWithExactly(cancelationJob.payload.execution.id, cancelationJob)).to.equal(true);
    });

    it.skip('should send running state for the cancelation job', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          executionId: cancelationJob.id,
          status: 'running',
          message: `Job ${cancelationJob.id} accepted by ${jobBrokerHelper.cementHelper.brickName}`,
        },
      })).to.equal(true);
    });

    describe('Sub Cancelation Jobs', function() {
      it('should send a new Cancelation job for each running subjob', function() {
        subJobs.forEach(function(subJob) {
          expect(jobBrokerHelper.send.calledWith(sinon.match(subJob.cancelationJob))).to.equal(true);
        });
      });

      it('should define accept, reject, done and error events for each new Cancelation context', function() {
        subJobs.forEach(function(subJob) {
          expect(subJob.cancelationContext.once.calledWith('done')).to.equal(true);
          expect(subJob.cancelationContext.once.calledWith('error')).to.equal(true);
        });
      });

      context('when accept event is emitted on a sub Cancelation job', function() {
        before(function() {
          subJobs[0].cancelationContext.emit('accept', jobBrokerHelper.cementHelper.brickName);
        });

        it('should ack the cancelation job', function() {
          expect(jobBrokerHelper.ack.calledWithExactly(cancelationJob)).to.equal(true);
        });
      });

      context('when reject event is emitted on a sub Cancelation job', function() {
        const mockError = new Error('mock sub cancelation job error');
        before(function() {
          subJobs[1].cancelationContext.emit('reject', jobBrokerHelper.cementHelper.brickName, mockError);
        });

        it('should remove the global cancelation job from runningJobs Map', function() {
          expect(jobBrokerHelper.remove.calledWithExactly(cancelationJob)).to.equal(true);
        });

        it.skip('should send finished state for the global cancelation job', function() {
          expect(jobBrokerHelper.send.calledWithExactly({
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: cancelationJob.id,
              status: 'finished',
              message: `group Job ${cancelationJob.payload.execution.id} canceled (MANUAL) with rejection error ${mockError}`,
              error: mockError,
            },
          })).to.equal(true);
        });

        it('should ack the cancelation job', function() {
          expect(jobBrokerHelper.ack.calledWithExactly(cancelationJob)).to.equal(true);
        });
      });

      context('when done event is emitted on a sub Cancelation job', function() {
        before(function() {
          subJobs[0].cancelationContext.emit('done', jobBrokerHelper.cementHelper.brickName);
        });

        it('should remove the global cancelation job from runningJobs Map', function() {
          expect(jobBrokerHelper.remove.calledWithExactly(cancelationJob)).to.equal(true);
        });

        it.skip('should send finished state for the global cancelation job', function() {
          expect(jobBrokerHelper.send.calledWithExactly({
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: cancelationJob.id,
              status: 'finished',
              message: `group Job ${cancelationJob.payload.execution.id} canceled (MANUAL).`,
            },
          })).to.equal(true);
        });
      });

      context('when error event is emitted on a sub Cancelation job', function() {
        const mockError = new Error('mock sub cancelation job error');
        before(function() {
          subJobs[1].cancelationContext.emit('error', jobBrokerHelper.cementHelper.brickName, mockError);
        });

        it('should remove the global cancelation job from runningJobs Map', function() {
          expect(jobBrokerHelper.remove.calledWithExactly(cancelationJob)).to.equal(true);
        });

        it.skip('should send finished state for the global cancelation job', function() {
          expect(jobBrokerHelper.send.calledWithExactly({
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: cancelationJob.id,
              status: 'finished',
              message: `group Job ${cancelationJob.payload.execution.id} canceled (MANUAL) with error ${mockError}`,
              error: mockError,
            },
          })).to.equal(true);
        });
      });
    });
  });

  context('when there are no running sub jobs of Group job', function() {
    const groupJob = new ReadJob();
    const cancelationJob = new CancelJob(groupJob.payload.execution.id);
    before(function() {
      jobBrokerHelper.runningJobs.run.clear();
      jobBrokerHelper.runningJobs.read.set(groupJob.payload.execution.id, groupJob);
      sinon.stub(jobBrokerHelper.runningJobs.cancel, 'set');
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper, 'remove');
      sinon.stub(jobBrokerHelper, 'ack');
      jobBrokerHelper.cancelGroupJob(cancelationJob, groupJob);
    });
    after(function() {
      jobBrokerHelper.runningJobs.read.clear();
      jobBrokerHelper.runningJobs.cancel.set.restore();
      jobBrokerHelper.send.restore();
      jobBrokerHelper.remove.restore();
      jobBrokerHelper.ack.restore();
    });

    it('should add the cancelation job to the runningJobs cancel Map', function() {
      expect(jobBrokerHelper.runningJobs.cancel.set.calledWithExactly(cancelationJob.payload.execution.id, cancelationJob)).to.equal(true);
    });

    it.skip('should send running state for the cancelation job', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          jobid: cancelationJob.id,
          state: 'running',
          message: `Job ${cancelationJob.id} accepted by ${jobBrokerHelper.cementHelper.brickName}`,
        },
      })).to.equal(true);
    });

    it('should remove the cancelation job from runningJobs cancel Map', function() {
      expect(jobBrokerHelper.remove.calledWithExactly(cancelationJob)).to.equal(true);
    });

    it.skip('should send finished state for the cancelation job', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          jobid: cancelationJob.id,
          state: 'finished',
          message: `group Job ${cancelationJob.payload.jobid} canceled (MANUAL).`,
        },
      })).to.equal(true);
    });

    it('should ack the cancelation job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(cancelationJob)).to.equal(true);
    });
  });
});
