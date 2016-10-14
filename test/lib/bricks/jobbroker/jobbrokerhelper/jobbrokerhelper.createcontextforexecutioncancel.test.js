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
const CancelJob = require('./jobbrokerhelper.execution.cancel.testdata.js');

describe('JobBroker - JobBrokerHelper - createContextForExecutionCancel', function() {
  let jobBrokerHelper;
  const runningJobs = {
    run: new Map(),
    read: new Map(),
    cancel: new Map(),
  };
  const jobQueue = new JobQueue(jobQueueOpts);
  const jobToCancel = new RunJob();
  const job = new CancelJob(jobToCancel.payload.execution.id);
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
    sinon.stub(jobBrokerHelper.runningJobs.cancel, 'set');
    sinon.spy(mockContext, 'once');
    result = jobBrokerHelper.createContextForExecutionCancel(job);
  });
  after(function() {
    jobBrokerHelper.runningJobs.cancel.set.restore();
  });
  it('should add job to runningJobs run', function() {
    expect(jobBrokerHelper.runningJobs.cancel.set.calledWithExactly(jobId, job)).to.equal(true);
  });

  it('should create a new context with cementHelper', function() {
    const execJob = {
      // id: jobId,
      nature: {
        type: 'execution',
        quality: 'cancel',
      },
      payload: {
        jobid: job.payload.execution.id,
      },
    };
    expect(mockCementHelper.createContext.calledWith(sinon.match(execJob))).to.equal(true);
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
      jobBrokerHelper.createContextForExecutionCancel(job);
      mockContext.emit('accept', outputBrickName);
    });

    after(function() {
      jobBrokerHelper.ack.restore();
    });

    it('should ack job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.be.equal(true);
    });
  });

  describe('when mockContext emit reject event', function() {
    const mockRejectError = new Error('mock reject');
    before(function() {
      sinon.stub(jobBrokerHelper, 'ack');
      sinon.stub(jobBrokerHelper, 'remove');
      sinon.stub(jobBrokerHelper.logger, 'error');
      jobBrokerHelper.createContextForExecutionCancel(job);
      mockContext.emit('reject', 'jobhandler', mockRejectError);
    });

    after(function() {
      jobBrokerHelper.ack.restore();
      jobBrokerHelper.remove.restore();
      jobBrokerHelper.logger.error.restore();
    });

    it('should ack job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.be.equal(true);
    });

    it('should remove job', function() {
      expect(jobBrokerHelper.remove.calledWithExactly(job)).to.be.equal(true);
    });

    it('should log error', function() {
      const log = 'Execution: ' + job.payload.execution.id +
        ' (CANCEL)' +
        ' - finished with rejection: ' + mockRejectError;
      expect(jobBrokerHelper.logger.error.calledWithExactly(log)).to.be.equal(true);
    });
  });

  describe('when mockContext emit progress event', function() {
    const mockDoneResponse = {
      state: 'finished',
      message: 'Mock done',
    };
    before(function() {
      sinon.stub(jobBrokerHelper.logger, 'info');
      jobBrokerHelper.createContextForExecutionCancel(job);
      mockContext.emit('progress', 'jobhandler', mockDoneResponse);
    });

    after(function() {
      jobBrokerHelper.logger.info.restore();
    });

    it('should log info', function() {
      const log = 'Execution: ' + job.payload.execution.id +
        ' (CANCEL)' +
        ' - running';
      expect(jobBrokerHelper.logger.info.calledWithExactly(log)).to.be.equal(true);
    });
  });

  describe('when mockContext emit done event', function() {
    const mockDoneResponse = {
      state: 'finished',
      message: 'Mock done',
    };
    before(function() {
      sinon.stub(jobBrokerHelper, 'ack');
      sinon.stub(jobBrokerHelper, 'remove');
      sinon.stub(jobBrokerHelper.logger, 'info');
      jobBrokerHelper.createContextForExecutionCancel(job);
      mockContext.emit('done', 'jobhandler', mockDoneResponse);
    });

    after(function() {
      jobBrokerHelper.ack.restore();
      jobBrokerHelper.remove.restore();
      jobBrokerHelper.logger.info.restore();
    });

    it('should remove job', function() {
      expect(jobBrokerHelper.remove.calledWithExactly(job)).to.be.equal(true);
    });

    it('should log info', function() {
      const log = 'Execution: ' + job.payload.execution.id +
        ' (CANCEL)' +
        ' - finished';
      expect(jobBrokerHelper.logger.info.calledWithExactly(log)).to.be.equal(true);
    });
  });

  describe('when mockContext emit error event', function() {
    const mockError = new Error('mock reject');
    before(function() {
      sinon.stub(jobBrokerHelper, 'remove');
      sinon.stub(jobBrokerHelper.logger, 'error');
      jobBrokerHelper.createContextForExecutionCancel(job);
      mockContext.emit('error', 'jobhandler', mockError);
    });

    after(function() {
      jobBrokerHelper.remove.restore();
      jobBrokerHelper.logger.error.restore();
    });

    it('should remove job', function() {
      expect(jobBrokerHelper.remove.calledWithExactly(job)).to.be.equal(true);
    });

    it('should log error', function() {
      const log = 'Execution: ' + job.payload.execution.id +
        ' (CANCEL)' +
        ' - finished with error: ' + mockError;
      expect(jobBrokerHelper.logger.error.calledWithExactly(log)).to.be.equal(true);
    });
  });
});
