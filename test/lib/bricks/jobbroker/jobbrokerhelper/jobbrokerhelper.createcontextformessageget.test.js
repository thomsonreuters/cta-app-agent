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

const JobBrokerHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobbrokerhelper.js'));
const JobQueue = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobqueue.js'));
const jobQueueOpts = require('./jobqueueopts.testdata.js');
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();
const ReadJob = require('./jobbrokerhelper.execution.read.testdata.js');

describe('JobBroker - JobBrokerHelper - createContextForMessageGet', function() {
  let jobBrokerHelper;
  const runningJobs = {
    run: new Map(),
    read: new Map(),
    cancel: new Map(),
  };
  const jobQueue = new JobQueue(jobQueueOpts);
  const groupjob = new ReadJob();
  const queuegetjob = {
    nature: {
      type: 'message',
      quality: 'get',
    },
    payload: {
      groupExecutionId: groupjob.payload.execution.id,
      queue: groupjob.payload.queue,
    },
  };
  const queuegetopts = {
    first: true,
  };
  const mockContext = new EventEmitter();
  const mockCementHelper = {
    constructor: {
      name: 'CementHelper',
    },
    createContext: sinon.stub().withArgs(queuegetjob).returns(mockContext),
  };
  let result;
  before(function() {
    jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
    sinon.spy(mockContext, 'once');
    result = jobBrokerHelper.createContextForMessageGet(queuegetjob);
  });
  after(function() {
  });

  it('should create a new context with cementHelper', function() {
    expect(mockCementHelper.createContext.calledWithExactly(queuegetjob)).to.equal(true);
  });

  it('should return cementHelper created context', function() {
    expect(result).to.deep.equal(mockContext);
  });

  it('should define accept, reject, done and error events listeners', function() {
    expect(mockContext.once.calledWith('accept')).to.equal(true);
    expect(mockContext.once.calledWith('reject')).to.equal(true);
    expect(mockContext.once.calledWith('done')).to.equal(true);
    expect(mockContext.once.calledWith('error')).to.equal(true);
  });

  describe('when mockContext emit accept event', function() {
    context('when queuegetjob is the first one for a group job', function() {
      const outputBrickName = 'receiver';
      before(function() {
        sinon.stub(jobBrokerHelper, 'send');
        jobBrokerHelper.createContextForMessageGet(queuegetjob, queuegetopts);
        mockContext.emit('accept', outputBrickName);
      });

      after(function() {
        jobBrokerHelper.send.restore();
      });

      it('should send setRunningJob for the group job', function() {
        sinon.assert.calledWithExactly(jobBrokerHelper.send, {
          nature: {
            type: 'result',
            quality: 'setRunningJob',
          },
          payload: {
            executionId: queuegetjob.payload.groupExecutionId,
          },
        });
      });
    });
  });

  describe('when mockContext emit reject event', function() {
    context('when queuegetjob is for a group job', function() {
      const outputBrickName = 'receiver';
      const mockRejectError = new Error('mock reject');
      before(function() {
        sinon.stub(jobBrokerHelper, 'terminateGroupJob');
        jobBrokerHelper.createContextForMessageGet(queuegetjob);
        mockContext.emit('reject', outputBrickName, mockRejectError);
      });

      after(function() {
        jobBrokerHelper.terminateGroupJob.restore();
      });

      it('should terminate group job with acked state', function() {
        const stateJob = {
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: queuegetjob.payload.groupExecutionId,
            status: 'acked',
            message: `message-get job was rejected by ${outputBrickName} with: ${mockRejectError.message}.`,
            error: mockRejectError,
          },
        };
        expect(jobBrokerHelper.terminateGroupJob
          .calledWithExactly(queuegetjob.payload.groupExecutionId, stateJob)).to.be.equal(true);
      });
    });
  });

  describe('when mockContext emit done event', function() {
    context('when there is no more message and the queuegetjob is for a group job', function() {
      context('when the queuegetjob was the first', function() {
        const mockDoneResponse = {
          state: 'finished',
          message: 'Mock done',
          noMoreMessage: true,
        };
        before(function() {
          sinon.stub(jobBrokerHelper, 'terminateGroupJob');
          jobBrokerHelper.createContextForMessageGet(queuegetjob, queuegetopts);
          mockContext.emit('done', 'receiver', mockDoneResponse);
        });

        after(function() {
          jobBrokerHelper.terminateGroupJob.restore();
        });

        it('should terminate group job with acked state', function() {
          const stateJob = {
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: queuegetjob.payload.groupExecutionId,
              status: 'acked',
              message: `No more Jobs to run for group Job ${queuegetjob.payload.groupExecutionId}.`,
            },
          };
          expect(jobBrokerHelper.terminateGroupJob
            .calledWithExactly(queuegetjob.payload.groupExecutionId, stateJob)).to.be.equal(true);
        });
      });

      context('when the queuegetjob was not the first', function() {
        const mockDoneResponse = {
          state: 'finished',
          message: 'Mock done',
          noMoreMessage: true,
        };
        before(function() {
          sinon.stub(jobBrokerHelper, 'terminateGroupJob');
          jobBrokerHelper.createContextForMessageGet(queuegetjob);
          mockContext.emit('done', 'receiver', mockDoneResponse);
        });

        after(function() {
          jobBrokerHelper.terminateGroupJob.restore();
        });

        it('should terminate group job', function() {
          expect(jobBrokerHelper.terminateGroupJob
            .calledWithExactly(queuegetjob.payload.groupExecutionId)).to.be.equal(true);
        });
      });
    });
  });

  describe('when mockContext emit reject event', function() {
    context('when queuegetjob is for a group job', function() {
      const outputBrickName = 'receiver';
      const mockError = new Error('mock error');
      before(function() {
        sinon.stub(jobBrokerHelper, 'terminateGroupJob');
        jobBrokerHelper.createContextForMessageGet(queuegetjob);
        mockContext.emit('error', outputBrickName, mockError);
      });

      after(function() {
        jobBrokerHelper.terminateGroupJob.restore();
      });

      it('should terminate group job with acked state', function() {
        const stateJob = {
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: queuegetjob.payload.groupExecutionId,
            status: 'acked',
            message: `message-get job finished by ${outputBrickName} with error: ${mockError.message}.`,
            error: mockError,
          },
        };
        expect(jobBrokerHelper.terminateGroupJob
          .calledWithExactly(queuegetjob.payload.groupExecutionId, stateJob)).to.be.equal(true);
      });
    });
  });
});
