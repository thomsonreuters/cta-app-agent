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
const RunJob = require('./jobbrokerhelper.execution.run.testdata.js');
const ReadJob = require('./jobbrokerhelper.execution.read.testdata.js');

describe('JobBroker - JobBrokerHelper - createContextForExecutionRun', function() {
  let jobBrokerHelper;
  const runningJobs = {
    run: new Map(),
    read: new Map(),
    cancel: new Map(),
  };
  const jobQueue = new JobQueue(jobQueueOpts);
  const job = new RunJob();
  const jobId = job.payload.execution.id;
  const mockContext = new EventEmitter();
  const mockCementHelper = {
    constructor: {
      name: 'CementHelper',
    },
    createContext: sinon.stub().withArgs(job).returns(mockContext),
  };
  let result;
  before(function() {
    jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
    sinon.stub(jobBrokerHelper.runningJobs.run, 'set');
    sinon.spy(mockContext, 'once');
    result = jobBrokerHelper.createContextForExecutionRun(job);
  });
  after(function() {
    jobBrokerHelper.runningJobs.run.set.restore();
  });
  it('should add job to runningJobs run', function() {
    expect(jobBrokerHelper.runningJobs.run.set.calledWithExactly(jobId, job)).to.equal(true);
  });

  it('should create a new context with cementHelper', function() {
    const execJob = {
      id: jobId,
      nature: {
        type: 'execution',
        quality: 'commandLine',
      },
      payload: {
        timeout: job.payload.execution.runningTimeout,
        stages: job.payload.testSuite.tests[0].stages,
      },
    };
    expect(mockCementHelper.createContext.calledWithExactly(execJob)).to.equal(true);
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
    const outputBrickName = 'jobhandler';
    before(function() {
      sinon.stub(jobBrokerHelper, 'ack');
      sinon.stub(jobBrokerHelper, 'send');
      jobBrokerHelper.createContextForExecutionRun(job);
      mockContext.emit('accept', outputBrickName);
    });

    after(function() {
      jobBrokerHelper.ack.restore();
      jobBrokerHelper.send.restore();
    });

    it('should send running state', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          executionId: jobId,
          status: 'running',
          message: `Job ${jobId} accepted by ${outputBrickName}.`,
        },
      })).to.be.equal(true);
    });

    it('should ack job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.be.equal(true);
    });
  });

  describe('when mockContext emit reject event', function() {
    const mockRejectError = new Error('mock reject');
    before(function() {
      sinon.stub(jobBrokerHelper, 'ack');
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper, 'remove');
      jobBrokerHelper.createContextForExecutionRun(job);
      mockContext.emit('reject', 'jobhandler', mockRejectError);
    });

    after(function() {
      jobBrokerHelper.ack.restore();
      jobBrokerHelper.send.restore();
      jobBrokerHelper.remove.restore();
    });

    it('should send finished state', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          executionId: jobId,
          status: 'finished',
          error: mockRejectError,
          message: mockRejectError.message,
        },
      })).to.be.equal(true);
    });

    it('should ack job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.be.equal(true);
    });

    it('should remove job', function() {
      expect(jobBrokerHelper.remove.calledWithExactly(job)).to.be.equal(true);
    });
  });

  describe('when mockContext emit done event', function() {
    context('when it is any job', function() {
      const mockDoneResponse = {
        state: 'finished',
        message: 'Mock done',
      };
      before(function() {
        sinon.stub(jobBrokerHelper, 'ack');
        sinon.stub(jobBrokerHelper, 'send');
        sinon.stub(jobBrokerHelper, 'remove');
        jobBrokerHelper.createContextForExecutionRun(job);
        mockContext.emit('done', 'jobhandler', mockDoneResponse);
      });

      after(function() {
        jobBrokerHelper.ack.restore();
        jobBrokerHelper.send.restore();
        jobBrokerHelper.remove.restore();
      });

      it('should send finished state', function() {
        expect(jobBrokerHelper.send.calledWithExactly({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: jobId,
            status: mockDoneResponse.state,
            message: mockDoneResponse.message,
          },
        })).to.be.equal(true);
      });

      it('should remove job', function() {
        expect(jobBrokerHelper.remove.calledWithExactly(job)).to.be.equal(true);
      });
    });

    context('when job belongs to a running group job', function() {
      context('when job was finished normally', function() {
        const mockDoneResponse = {
          state: 'finished',
          message: 'Mock done',
        };
        const groupjob = new ReadJob();
        before(function() {
          job.payload.execution.id = groupjob.payload.execution.id;
          sinon.stub(jobBrokerHelper, 'send');
          sinon.stub(jobBrokerHelper, 'remove');
          sinon.stub(jobBrokerHelper.runningJobs.read, 'has').withArgs(job.payload.execution.id).returns(true);
          sinon.stub(jobBrokerHelper.runningJobs.read, 'get').withArgs(job.payload.execution.id).returns(groupjob);
          jobBrokerHelper.createContextForExecutionRun(job);
          mockContext.emit('done', 'jobhandler', mockDoneResponse);
        });

        after(function() {
          jobBrokerHelper.send.restore();
          jobBrokerHelper.remove.restore();
          jobBrokerHelper.runningJobs.read.has.restore();
          jobBrokerHelper.runningJobs.read.get.restore();
        });

        it('should also send a queue-get job for the running group job', function() {
          expect(jobBrokerHelper.runningJobs.read.get.calledWithExactly(job.payload.execution.id)).to.equal(true);
          expect(jobBrokerHelper.send.calledWithExactly({
            nature: {
              type: 'message',
              quality: 'get',
            },
            payload: {
              groupExecutionId: groupjob.payload.execution.id,
              queue: groupjob.payload.queue,
            },
          })).to.be.equal(true);
        });
      });

      context('when job was finished by a manual cancelation', function() {
        const mockDoneResponse = {
          state: 'finished',
          message: 'Mock done',
          cancelMode: 'MANUAL',
        };
        const groupjob = new ReadJob();
        before(function() {
          job.payload.execution.id = groupjob.payload.execution.id;
          sinon.stub(jobBrokerHelper, 'send');
          sinon.stub(jobBrokerHelper, 'remove');
          sinon.stub(jobBrokerHelper, 'terminateGroupJob');
          sinon.stub(jobBrokerHelper.runningJobs.read, 'has').withArgs(job.payload.execution.id).returns(true);
          sinon.stub(jobBrokerHelper.runningJobs.read, 'get').withArgs(job.payload.execution.id).returns(groupjob);
          jobBrokerHelper.createContextForExecutionRun(job);
          mockContext.emit('done', 'jobhandler', mockDoneResponse);
        });

        after(function() {
          jobBrokerHelper.send.restore();
          jobBrokerHelper.remove.restore();
          jobBrokerHelper.terminateGroupJob.restore();
          jobBrokerHelper.runningJobs.read.has.restore();
          jobBrokerHelper.runningJobs.read.get.restore();
        });

        it('should terminate the running group job', function() {
          expect(jobBrokerHelper.terminateGroupJob.calledWithExactly(job.payload.execution.id, {
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              jobid: job.payload.execution.id,
              state: 'canceled',
              message: `group Job ${job.payload.execution.id} canceled (MANUAL) during sub-Job ${job.payload.execution.id}`,
            },
          }));
        });
      });
    });
  });

  describe('when mockContext emit error event', function() {
    context('when it is any job', function() {
      const mockError = new Error('mock reject');
      before(function() {
        sinon.stub(jobBrokerHelper, 'ack');
        sinon.stub(jobBrokerHelper, 'send');
        sinon.stub(jobBrokerHelper, 'remove');
        jobBrokerHelper.createContextForExecutionRun(job);
        mockContext.emit('error', 'jobhandler', mockError);
      });

      after(function() {
        jobBrokerHelper.ack.restore();
        jobBrokerHelper.send.restore();
        jobBrokerHelper.remove.restore();
      });

      it('should send finished state', function() {
        expect(jobBrokerHelper.send.calledWithExactly({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: jobId,
            status: 'finished',
            error: mockError,
            message: mockError.message,
          },
        })).to.be.equal(true);
      });

      it('should remove job', function() {
        expect(jobBrokerHelper.remove.calledWithExactly(job)).to.be.equal(true);
      });
    });

    context('when job belongs to a running group job', function() {
      const mockError = new Error('mock reject');
      const groupjob = new ReadJob();
      before(function() {
        job.payload.execution.id = groupjob.payload.execution.id;
        sinon.stub(jobBrokerHelper, 'send');
        sinon.stub(jobBrokerHelper, 'remove');
        sinon.stub(jobBrokerHelper.runningJobs.read, 'has').withArgs(job.payload.execution.id).returns(true);
        sinon.stub(jobBrokerHelper.runningJobs.read, 'get').withArgs(job.payload.execution.id).returns(groupjob);
        jobBrokerHelper.createContextForExecutionRun(job);
        mockContext.emit('error', 'jobhandler', mockError);
      });

      after(function() {
        jobBrokerHelper.send.restore();
        jobBrokerHelper.remove.restore();
        jobBrokerHelper.runningJobs.read.has.restore();
        jobBrokerHelper.runningJobs.read.get.restore();
      });

      it('should also send a queue-get job for the running group job', function() {
        expect(jobBrokerHelper.runningJobs.read.get.calledWithExactly(job.payload.execution.id)).to.equal(true);
        expect(jobBrokerHelper.send.calledWithExactly({
          nature: {
            type: 'message',
            quality: 'get',
          },
          payload: {
            groupExecutionId: groupjob.payload.execution.id,
            queue: groupjob.payload.queue,
          },
        })).to.be.equal(true);
      });
    });
  });
});
