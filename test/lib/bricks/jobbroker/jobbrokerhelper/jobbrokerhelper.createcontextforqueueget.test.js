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

describe('JobBroker - JobBrokerHelper - createContextForQueueGet', function() {
  let jobBrokerHelper;
  const runningJobs = new Map();
  const jobQueue = new JobQueue(jobQueueOpts);
  const groupjob = {
    id: new ObjectID(),
    nature: {
      type: 'execution',
      quality: 'group',
    },
    payload: {
      queue: 'some-queue',
    },
  };
  const queuegetjob = {
    'nature': {
      'type': 'message',
      'quality': 'get',
    },
    'payload': {
      'groupjobid': groupjob.id,
      'queue': groupjob.payload.queue,
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
    sinon.stub(jobBrokerHelper.runningJobs, 'set');
    sinon.spy(mockContext, 'once');
    result = jobBrokerHelper.createContextForQueueGet(queuegetjob);
  });
  after(function() {
    jobBrokerHelper.runningJobs.set.restore();
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
    // expect(mockContext.once.calledWith('error')).to.equal(true);
  });

  describe('when mockContext emit accept event', function() {
    context('when queuegetjob is the first one for a group job', function() {
      const outputBrickName = 'receiver';
      before(function() {
        sinon.stub(jobBrokerHelper, 'send');
        jobBrokerHelper.createContextForQueueGet(queuegetjob, queuegetopts);
        mockContext.emit('accept', outputBrickName);
      });

      after(function() {
        jobBrokerHelper.send.restore();
      });

      it('should send running state for the group job', function() {
        expect(jobBrokerHelper.send.calledWithExactly({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            jobid: queuegetjob.payload.groupjobid,
            state: 'running',
            message: `GET message request for group Job ${queuegetjob.payload.groupjobid} accepted by ${outputBrickName}.`,
          },
        })).to.be.equal(true);
      });
    });
  });

  describe('when mockContext emit reject event', function() {
    context('when queuegetjob is for a group job', function() {
      const outputBrickName = 'receiver';
      const mockRejectError = new Error('mock reject');
      before(function() {
        sinon.stub(jobBrokerHelper, 'terminateGroupJob');
        jobBrokerHelper.createContextForQueueGet(queuegetjob);
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
            jobid: queuegetjob.payload.groupjobid,
            state: 'acked',
            message: `message-get job was rejected by ${outputBrickName} with: ${mockRejectError.message}.`,
            error: mockRejectError,
          },
        };
        expect(jobBrokerHelper.terminateGroupJob
          .calledWithExactly(queuegetjob.payload.groupjobid, stateJob)).to.be.equal(true);
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
          jobBrokerHelper.createContextForQueueGet(queuegetjob, queuegetopts);
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
              jobid: queuegetjob.payload.groupjobid,
              state: 'acked',
              message: `No more Jobs to run for group Job ${queuegetjob.payload.groupjobid}.`,
            },
          };
          expect(jobBrokerHelper.terminateGroupJob
            .calledWithExactly(queuegetjob.payload.groupjobid, stateJob)).to.be.equal(true);
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
          jobBrokerHelper.createContextForQueueGet(queuegetjob);
          mockContext.emit('done', 'receiver', mockDoneResponse);
        });

        after(function() {
          jobBrokerHelper.terminateGroupJob.restore();
        });

        it('should terminate group job with finished state', function() {
          const stateJob = {
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              jobid: queuegetjob.payload.groupjobid,
              state: 'finished',
              message: `No more Jobs to run for group Job ${queuegetjob.payload.groupjobid}.`,
            },
          };
          expect(jobBrokerHelper.terminateGroupJob
            .calledWithExactly(queuegetjob.payload.groupjobid, stateJob)).to.be.equal(true);
        });
      });
    });
  });
});
