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

describe('JobBroker - JobBrokerHelper - createContextForCommandline', function() {
  let jobBrokerHelper;
  const runningJobs = new Map();
  const jobQueue = new JobQueue(jobQueueOpts);
  const job = {
    id: new ObjectID(),
    nature: {
      type: 'execution',
      quality: 'commandline',
    },
    payload: {
    },
  };
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
    sinon.stub(jobBrokerHelper.runningJobs, 'set');
    sinon.spy(mockContext, 'once');
    result = jobBrokerHelper.createContextForCommandline(job);
  });
  after(function() {
    jobBrokerHelper.runningJobs.set.restore();
  });
  it('should add job to runningJobs', function() {
    expect(jobBrokerHelper.runningJobs.set.calledWithExactly(job.id, job)).to.equal(true);
  });

  it('should create a new context with cementHelper', function() {
    expect(mockCementHelper.createContext.calledWithExactly(job)).to.equal(true);
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
      jobBrokerHelper.createContextForCommandline(job);
      mockContext.emit('accept', outputBrickName);
    });

    after(function() {
      jobBrokerHelper.ack.restore();
      jobBrokerHelper.send.restore();
    });

    it('should send running changestate', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'execution',
          quality: 'changestate',
        },
        payload: {
          jobid: job.id,
          state: 'running',
          message: `Job ${job.id} accepted by ${outputBrickName}.`,
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
      jobBrokerHelper.createContextForCommandline(job);
      mockContext.emit('reject', 'jobhandler', mockRejectError);
    });

    after(function() {
      jobBrokerHelper.ack.restore();
      jobBrokerHelper.send.restore();
      jobBrokerHelper.remove.restore();
    });

    it('should send finished changestate', function() {
      expect(jobBrokerHelper.send.calledWithExactly({
        nature: {
          type: 'execution',
          quality: 'changestate',
        },
        payload: {
          jobid: job.id,
          state: 'finished',
          error: mockRejectError,
          message: mockRejectError.message,
        },
      })).to.be.equal(true);
    });

    it('should ack job', function() {
      expect(jobBrokerHelper.ack.calledWithExactly(job)).to.be.equal(true);
    });

    it('should remove job', function() {
      expect(jobBrokerHelper.remove.calledWithExactly(job.id)).to.be.equal(true);
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
        jobBrokerHelper.createContextForCommandline(job);
        mockContext.emit('done', 'jobhandler', mockDoneResponse);
      });

      after(function() {
        jobBrokerHelper.ack.restore();
        jobBrokerHelper.send.restore();
        jobBrokerHelper.remove.restore();
      });

      it('should send finished changestate', function() {
        expect(jobBrokerHelper.send.calledWithExactly({
          nature: {
            type: 'execution',
            quality: 'changestate',
          },
          payload: {
            jobid: job.id,
            state: mockDoneResponse.state,
            message: mockDoneResponse.message,
          },
        })).to.be.equal(true);
      });

      it('should remove job', function() {
        expect(jobBrokerHelper.remove.calledWithExactly(job.id)).to.be.equal(true);
      });
    });

    context('when job belongs to a running group job', function() {
      context('when job was finished normally', function() {
        const mockDoneResponse = {
          state: 'finished',
          message: 'Mock done',
        };
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
        before(function() {
          job.payload.groupjobid = groupjob.id;
          sinon.stub(jobBrokerHelper, 'send');
          sinon.stub(jobBrokerHelper, 'remove');
          sinon.stub(jobBrokerHelper.runningJobs, 'has').withArgs(job.payload.groupjobid).returns(true);
          sinon.stub(jobBrokerHelper.runningJobs, 'get').withArgs(job.payload.groupjobid).returns(groupjob);
          jobBrokerHelper.createContextForCommandline(job);
          mockContext.emit('done', 'jobhandler', mockDoneResponse);
        });

        after(function() {
          jobBrokerHelper.send.restore();
          jobBrokerHelper.remove.restore();
          jobBrokerHelper.runningJobs.has.restore();
          jobBrokerHelper.runningJobs.get.restore();
        });

        it('should also send a queue-get job for the running group job', function() {
          expect(jobBrokerHelper.runningJobs.get.calledWithExactly(job.payload.groupjobid)).to.equal(true);
          expect(jobBrokerHelper.send.calledWithExactly({
            'nature': {
              'type': 'message',
              'quality': 'get',
            },
            'payload': {
              'groupjobid': groupjob.id,
              'queue': groupjob.payload.queue,
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
        before(function() {
          job.payload.groupjobid = groupjob.id;
          sinon.stub(jobBrokerHelper, 'send');
          sinon.stub(jobBrokerHelper, 'remove');
          sinon.stub(jobBrokerHelper, 'terminateGroupJob');
          sinon.stub(jobBrokerHelper.runningJobs, 'has').withArgs(job.payload.groupjobid).returns(true);
          sinon.stub(jobBrokerHelper.runningJobs, 'get').withArgs(job.payload.groupjobid).returns(groupjob);
          jobBrokerHelper.createContextForCommandline(job);
          mockContext.emit('done', 'jobhandler', mockDoneResponse);
        });

        after(function() {
          jobBrokerHelper.send.restore();
          jobBrokerHelper.remove.restore();
          jobBrokerHelper.terminateGroupJob.restore();
          jobBrokerHelper.runningJobs.has.restore();
          jobBrokerHelper.runningJobs.get.restore();
        });

        it('should terminate the running group job', function() {
          expect(jobBrokerHelper.terminateGroupJob.calledWithExactly(job.payload.groupjobid, {
            nature: {
              type: 'execution',
              quality: 'changestate',
            },
            payload: {
              jobid: job.payload.groupjobid,
              state: 'canceled',
              message: `group Job ${job.payload.groupjobid} canceled (MANUAL) during sub-Job ${job.id}`,
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
        jobBrokerHelper.createContextForCommandline(job);
        mockContext.emit('error', 'jobhandler', mockError);
      });

      after(function() {
        jobBrokerHelper.ack.restore();
        jobBrokerHelper.send.restore();
        jobBrokerHelper.remove.restore();
      });

      it('should send finished changestate', function() {
        expect(jobBrokerHelper.send.calledWithExactly({
          nature: {
            type: 'execution',
            quality: 'changestate',
          },
          payload: {
            jobid: job.id,
            state: 'finished',
            error: mockError,
            message: mockError.message,
          },
        })).to.be.equal(true);
      });

      it('should remove job', function() {
        expect(jobBrokerHelper.remove.calledWithExactly(job.id)).to.be.equal(true);
      });
    });

    context('when job belongs to a running group job', function() {
      const mockError = new Error('mock reject');
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
      before(function() {
        job.payload.groupjobid = groupjob.id;
        sinon.stub(jobBrokerHelper, 'send');
        sinon.stub(jobBrokerHelper, 'remove');
        sinon.stub(jobBrokerHelper.runningJobs, 'has').withArgs(job.payload.groupjobid).returns(true);
        sinon.stub(jobBrokerHelper.runningJobs, 'get').withArgs(job.payload.groupjobid).returns(groupjob);
        jobBrokerHelper.createContextForCommandline(job);
        mockContext.emit('error', 'jobhandler', mockError);
      });

      after(function() {
        jobBrokerHelper.send.restore();
        jobBrokerHelper.remove.restore();
        jobBrokerHelper.runningJobs.has.restore();
        jobBrokerHelper.runningJobs.get.restore();
      });

      it('should also send a queue-get job for the running group job', function() {
        expect(jobBrokerHelper.runningJobs.get.calledWithExactly(job.payload.groupjobid)).to.equal(true);
        expect(jobBrokerHelper.send.calledWithExactly({
          'nature': {
            'type': 'message',
            'quality': 'get',
          },
          'payload': {
            'groupjobid': groupjob.id,
            'queue': groupjob.payload.queue,
          },
        })).to.be.equal(true);
      });
    });
  });
});
