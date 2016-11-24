'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
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

  // const setRunningJobForResult = {
  //   nature: {
  //     type: 'result',
  //     quality: 'setRunningJob',
  //   },
  //   payload: {
  //     executionId: job.payload.execution.id,
  //     testSuiteId: job.payload.testSuite.id,
  //     testId: job.payload.testSuite.tests[0].id,
  //   },
  // };
  const mockSetRunningJobContext = new EventEmitter();

  const execJob = {
    id: jobId,
    nature: {
      type: 'execution',
      quality: job.payload.testSuite.tests[0].type,
    },
    payload: {
      timeout: job.payload.execution.runningTimeout,
      executionId: job.payload.execution.id,
      testSuiteId: job.payload.testSuite.id,
      testId: job.payload.testSuite.tests[0].id,
      stages: job.payload.testSuite.tests[0].stages,
    },
  };

  let _createContextForExecutionRun;
  let result;
  before(function() {
    jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
    _createContextForExecutionRun = jobBrokerHelper.createContextForExecutionRun.bind(jobBrokerHelper);
    sinon.stub(jobBrokerHelper, 'createContextForExecutionRun').returns({ publish: sinon.stub() });
      // the method being tested here is recursive. we need to stub the next calls but not the first one.
      // solution is to copy and keep the original method in memory, then stub it

    sinon.stub(jobBrokerHelper.runningJobs.run, 'set');
    sinon.stub(jobBrokerHelper, 'ack');
    sinon.stub(jobBrokerHelper, 'send').returns(mockSetRunningJobContext);
    sinon.spy(mockContext, 'once');
    result = _createContextForExecutionRun(job);
    console.log(result);
  });
  after(function() {
    jobBrokerHelper.runningJobs.run.set.restore();
    jobBrokerHelper.ack.restore();
    jobBrokerHelper.send.restore();
  });

  context('when mockSetRunningJobContext emit done event', function() {
    before(function() {
      mockSetRunningJobContext.emit('done');
    });

    it('should add job to runningJobs run', function() {
      expect(jobBrokerHelper.runningJobs.run.set.calledWithExactly(jobId, job)).to.equal(true);
    });

    it('should send running state', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          executionId: job.payload.execution.id,
          testSuiteId: job.payload.testSuite.id,
          testId: job.payload.testSuite.tests[0].id,
          status: 'running',
          message: `Job ${jobId} started.`,
        },
      })).to.be.equal(true);
    });

    it('should ack job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.be.equal(true);
    });
  });

  it('should create a new context with cementHelper', function() {
    sinon.assert.calledWithExactly(mockCementHelper.createContext, execJob, ['canceled', 'timeout']);
  });

  it('should return cementHelper created context', function() {
    expect(result).to.deep.equal(mockContext);
  });

  it('should define accept, reject, done and error events listeners', function() {
    expect(mockContext.once.calledWith('reject')).to.equal(true);
    expect(mockContext.once.calledWith('done')).to.equal(true);
    expect(mockContext.once.calledWith('error')).to.equal(true);
  });

  describe('when mockContext emit reject event', function() {
    const mockRejectError = new Error('mock reject');
    before(function() {
      sinon.stub(jobBrokerHelper, 'remove');
      sinon.stub(jobBrokerHelper.logger, 'error');
      _createContextForExecutionRun(job);
      mockContext.emit('reject', 'jobhandler', mockRejectError);
    });

    after(function() {
      jobBrokerHelper.remove.restore();
      jobBrokerHelper.logger.error.restore();
    });

    it('should send finished state', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'state',
          quality: 'create',
        },
        payload: {
          executionId: job.payload.execution.id,
          testSuiteId: job.payload.testSuite.id,
          testId: job.payload.testSuite.tests[0].id,
          status: 'finished',
          error: mockRejectError,
          message: mockRejectError.message,
        },
      })).to.be.equal(true);
    });

    it('should remove job', function() {
      expect(jobBrokerHelper.remove.calledWithExactly(job)).to.be.equal(true);
    });

    it('should log error', function() {
      const log = 'Execution: ' + execJob.payload.executionId +
        ' (RUN)' +
        ' - TestSuite: ' + execJob.payload.testSuiteId +
        ' - Test: ' + execJob.payload.testId +
        ' - finished with rejection' + mockRejectError;
      expect(jobBrokerHelper.logger.error.calledWithExactly(log)).to.be.equal(true);
    });
  });

  describe('when mockContext emit progress event', function() {
    before(function() {
      sinon.stub(jobBrokerHelper.logger, 'info');
      _createContextForExecutionRun(job);
      mockContext.emit('progress', 'jobhandler');
    });
    after(function() {
      jobBrokerHelper.logger.info.restore();
    });

    it('should log info', function() {
      const log = 'Execution: ' + execJob.payload.executionId +
        ' (RUN)' +
        ' - TestSuite: ' + execJob.payload.testSuiteId +
        ' - Test: ' + execJob.payload.testId +
        ' - running';
      sinon.assert.calledWithExactly(jobBrokerHelper.logger.info, log);
    });
  });

  describe('when mockContext emit done event', function() {
    context('when it is not the last test of tests Array', function() {
      const mockDoneResponse = {
        state: 'finished',
        message: 'Mock done',
      };
      const options = {
        testIndex: 1,
      };
      const nextOptions = {
        testIndex: options.testIndex + 1,
      };
      before(function() {
        sinon.stub(jobBrokerHelper, 'remove');
        _createContextForExecutionRun(job, options);
        mockContext.emit('done', 'jobhandler', mockDoneResponse);
      });
      after(function() {
        jobBrokerHelper.remove.restore();
      });

      it('should call createContextForExecutionRun with same job but next testIndex', function() {
        sinon.assert.calledWith(jobBrokerHelper.createContextForExecutionRun, job, nextOptions);
      });
    });

    context('when it is the last test of tests Array', function() {
      context('when job does not belong to a running group job', function() {
        const mockDoneResponse = {
          state: 'finished',
          message: 'Mock done',
        };
        let options;
        before(function() {
          sinon.stub(jobBrokerHelper, 'remove');
          options = {
            testIndex: job.payload.testSuite.tests.length - 1,
          };
          _createContextForExecutionRun(job, options);
          mockContext.emit('done', 'jobhandler', mockDoneResponse);
        });

        after(function() {
          jobBrokerHelper.remove.restore();
        });

        it('should send finished state', function() {
          sinon.assert.calledWithExactly(jobBrokerHelper.send, {
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              executionId: job.payload.execution.id,
              testSuiteId: job.payload.testSuite.id,
              testId: job.payload.testSuite.tests[options.testIndex].id,
              status: 'finished',
              message: mockDoneResponse.message,
            },
          });
        });

        it('should remove job', function() {
          expect(jobBrokerHelper.remove.calledWithExactly(job)).to.be.equal(true);
        });
      });

      context('when job belongs to a running group job', function() {
        const mockDoneResponse = {
          state: 'finished',
          message: 'Mock done',
        };
        const groupjob = new ReadJob();
        before(function() {
          job.payload.execution.id = groupjob.payload.execution.id;
          sinon.stub(jobBrokerHelper.runningJobs.read, 'has').withArgs(job.payload.execution.id).returns(true);
          sinon.stub(jobBrokerHelper.runningJobs.read, 'get').withArgs(job.payload.execution.id).returns(groupjob);
          const options = {
            testIndex: job.payload.testSuite.tests.length - 1,
          };
          _createContextForExecutionRun(job, options);
          mockContext.emit('done', 'jobhandler', mockDoneResponse);
        });

        after(function() {
          jobBrokerHelper.runningJobs.read.has.restore();
          jobBrokerHelper.runningJobs.read.get.restore();
        });

        it('should send a queue-get job for the running group job', function() {
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

  describe('when mockContext emit canceled event', function() {
    context('when job does not belong to a running group job', function() {
      const mockDoneResponse = {
        state: 'canceled',
        message: 'Mock canceled',
        cancelMode: 'manual',
      };
      let options;
      before(function() {
        sinon.stub(jobBrokerHelper, 'remove');
        options = {
          testIndex: job.payload.testSuite.tests.length - 1,
        };
        _createContextForExecutionRun(job, options);
        mockContext.emit('canceled', 'jobhandler', mockDoneResponse);
      });

      after(function() {
        jobBrokerHelper.remove.restore();
      });

      it('should send finished state', function() {
        expect(jobBrokerHelper.send.calledWithExactly({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: job.payload.execution.id,
            testSuiteId: job.payload.testSuite.id,
            testId: job.payload.testSuite.tests[options.testIndex].id,
            status: 'canceled',
            message: mockDoneResponse.message,
          },
        })).to.be.equal(true);
      });

      it('should remove job', function() {
        expect(jobBrokerHelper.remove.calledWithExactly(job)).to.be.equal(true);
      });
    });

    context('when job belongs to a running group job', function() {
      const mockDoneResponse = {
        state: 'canceled',
        message: 'Mock canceled',
        cancelMode: 'manual',
      };
      const groupjob = new ReadJob();
      let options;
      before(function() {
        job.payload.execution.id = groupjob.payload.execution.id;
        sinon.stub(jobBrokerHelper, 'remove');
        sinon.stub(jobBrokerHelper, 'terminateGroupJob');
        sinon.stub(jobBrokerHelper.runningJobs.read, 'has').withArgs(job.payload.execution.id).returns(true);
        sinon.stub(jobBrokerHelper.runningJobs.read, 'get').withArgs(job.payload.execution.id).returns(groupjob);
        options = {
          testIndex: job.payload.testSuite.tests.length - 1,
        };
        _createContextForExecutionRun(job, options);
        mockContext.emit('canceled', 'jobhandler', mockDoneResponse);
      });

      after(function() {
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
            executionId: job.payload.execution.id,
            testSuiteId: job.payload.testSuite.id,
            testId: job.payload.testSuite.tests[options.testIndex].id,
            state: 'canceled',
            message: `group Job ${job.payload.execution.id} canceled (${mockDoneResponse.cancelMode}) during sub-Job ${job.payload.execution.id}`,
          },
        }));
      });

      it('should remove job', function() {
        expect(jobBrokerHelper.remove.calledWithExactly(job)).to.be.equal(true);
      });
    });
  });

  describe('when mockContext emit timeout event', function() {
    context('when job does not belong to a running group job', function() {
      const mockDoneResponse = {
        state: 'timeout',
        message: 'Mock timeout',
        cancelMode: 'executionTimeout',
      };
      let options;
      before(function() {
        sinon.stub(jobBrokerHelper, 'remove');
        options = {
          testIndex: job.payload.testSuite.tests.length - 1,
        };
        _createContextForExecutionRun(job, options);
        mockContext.emit('timeout', 'jobhandler', mockDoneResponse);
      });

      after(function() {
        jobBrokerHelper.remove.restore();
      });

      it('should send finished state', function() {
        expect(jobBrokerHelper.send.calledWithExactly({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: job.payload.execution.id,
            testSuiteId: job.payload.testSuite.id,
            testId: job.payload.testSuite.tests[options.testIndex].id,
            status: 'timeout',
            message: mockDoneResponse.message,
          },
        })).to.be.equal(true);
      });

      it('should remove job', function() {
        expect(jobBrokerHelper.remove.calledWithExactly(job)).to.be.equal(true);
      });
    });

    context('when job belongs to a running group job', function() {
      const mockDoneResponse = {
        state: 'timeout',
        message: 'Mock timeout',
        cancelMode: 'executionTimeout',
      };
      const groupjob = new ReadJob();
      let options;
      before(function() {
        job.payload.execution.id = groupjob.payload.execution.id;
        sinon.stub(jobBrokerHelper, 'remove');
        sinon.stub(jobBrokerHelper, 'terminateGroupJob');
        sinon.stub(jobBrokerHelper.runningJobs.read, 'has').withArgs(job.payload.execution.id).returns(true);
        sinon.stub(jobBrokerHelper.runningJobs.read, 'get').withArgs(job.payload.execution.id).returns(groupjob);
        options = {
          testIndex: job.payload.testSuite.tests.length - 1,
        };
        _createContextForExecutionRun(job, options);
        mockContext.emit('timeout', 'jobhandler', mockDoneResponse);
      });

      after(function() {
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
            executionId: job.payload.execution.id,
            testSuiteId: job.payload.testSuite.id,
            testId: job.payload.testSuite.tests[options.testIndex].id,
            state: 'timeout',
            message: `group Job ${job.payload.execution.id} timeout (${mockDoneResponse.cancelMode}) during sub-Job ${job.payload.execution.id}`,
          },
        }));
      });

      it('should remove job', function() {
        expect(jobBrokerHelper.remove.calledWithExactly(job)).to.be.equal(true);
      });
    });
  });

  describe('when mockContext emit error event', function() {
    context('when it is any job', function() {
      const mockError = new Error('mock reject');
      before(function() {
        sinon.stub(jobBrokerHelper, 'remove');
        sinon.stub(jobBrokerHelper.logger, 'error');
        _createContextForExecutionRun(job);
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
        const log = 'Execution: ' + execJob.payload.executionId +
          ' (RUN)' +
          ' - TestSuite: ' + execJob.payload.testSuiteId +
          ' - Test: ' + execJob.payload.testId +
          ' - finished with error' + mockError;
        expect(jobBrokerHelper.logger.error.calledWithExactly(log)).to.be.equal(true);
      });
    });

    context('when job does not belongs to group job', function() {
      const mockError = new Error('mock reject');
      before(function() {
        _createContextForExecutionRun(job);
        mockContext.emit('error', 'jobhandler', mockError);
      });

      it('should send finished state', function() {
        expect(jobBrokerHelper.send.calledWithExactly({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            executionId: job.payload.execution.id,
            testSuiteId: job.payload.testSuite.id,
            testId: job.payload.testSuite.tests[0].id,
            status: 'finished',
            error: mockError,
            message: mockError.message,
          },
        })).to.be.equal(true);
      });
    });

    context('when job belongs to a running group job', function() {
      const mockError = new Error('mock reject');
      const groupjob = new ReadJob();
      before(function() {
        job.payload.execution.id = groupjob.payload.execution.id;
        sinon.stub(jobBrokerHelper.runningJobs.read, 'has').withArgs(job.payload.execution.id).returns(true);
        sinon.stub(jobBrokerHelper.runningJobs.read, 'get').withArgs(job.payload.execution.id).returns(groupjob);
        _createContextForExecutionRun(job);
        mockContext.emit('error', 'jobhandler', mockError);
      });

      after(function() {
        jobBrokerHelper.runningJobs.read.has.restore();
        jobBrokerHelper.runningJobs.read.get.restore();
      });

      it('should send a queue-get job for the running group job', function() {
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
