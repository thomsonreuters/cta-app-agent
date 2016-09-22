'use strict';
const appRootPath = require('app-root-path').path;
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

describe('JobBroker - JobBrokerHelper - processDefault', function() {
  let jobBrokerHelper;
  const runningJobs = new Map();
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
    const job = {
      id: new ObjectID(),
      nature: {
        type: 'execution',
        quality: 'commandline',
      },
      payload: {
      },
    };
    before(function() {
      sinon.stub(jobBrokerHelper, 'send');
      jobBrokerHelper.runningJobs.clear();
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
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandline',
        },
        payload: {
          priority: 0,
        },
      };
      const runningJob = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandline',
        },
        payload: {},
      };
      before(function() {
        sinon.stub(jobBrokerHelper, 'send');
        jobBrokerHelper.runningJobs.set(runningJob.id, runningJob);
        jobBrokerHelper.processDefault(job);
      });
      after(function() {
        jobBrokerHelper.send.restore();
        jobBrokerHelper.runningJobs.clear();
      });
      it('should send the job', function() {
        expect(jobBrokerHelper.send.calledWithExactly(job)).to.equal(true);
      });
    });

    context('when job belongs to a running group job', function() {
      const runningJob = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'group',
        },
        payload: {},
      };
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandline',
        },
        payload: {
          groupjobid: runningJob.id,
        },
      };
      before(function() {
        sinon.stub(jobBrokerHelper, 'send');
        jobBrokerHelper.runningJobs.set(runningJob.id, runningJob);
        jobBrokerHelper.processDefault(job);
      });
      after(function() {
        jobBrokerHelper.send.restore();
        jobBrokerHelper.runningJobs.clear();
      });
      it('should send the job', function() {
        expect(jobBrokerHelper.send.calledWithExactly(job)).to.equal(true);
      });
    });

    context('when job priority is not zero and does not belong to a running group job', function() {
      context('when queuing the job succeeds', function() {
        const job = {
          id: new ObjectID(),
          nature: {
            type: 'execution',
            quality: 'commandline',
          },
          payload: {
          },
        };
        const runningJob = {
          id: new ObjectID(),
          nature: {
            type: 'execution',
            quality: 'commandline',
          },
          payload: {},
        };
        before(function() {
          sinon.stub(jobBrokerHelper.queue, 'queue');
          sinon.stub(jobBrokerHelper.logger, 'info');
          jobBrokerHelper.runningJobs.set(runningJob.id, runningJob);
          jobBrokerHelper.processDefault(job);
        });
        after(function() {
          jobBrokerHelper.queue.queue.restore();
          jobBrokerHelper.logger.info.restore();
          jobBrokerHelper.runningJobs.clear();
        });
        it('should queue the job', function() {
          expect(jobBrokerHelper.queue.queue.calledWithExactly(job)).to.equal(true);
        });
        it('should log info that job was queued', function() {
          const message = `${jobBrokerHelper.cementHelper.brickName}: job ${job.id} has been queued.`;
          expect(jobBrokerHelper.logger.info.calledWithExactly(message)).to.equal(true);
        });
      });

      context('when queuing the job fails', function() {
        const job = {
          id: new ObjectID(),
          nature: {
            type: 'execution',
            quality: 'commandline',
          },
          payload: {
          },
        };
        const runningJob = {
          id: new ObjectID(),
          nature: {
            type: 'execution',
            quality: 'commandline',
          },
          payload: {},
        };
        const queueError = new Error('mock queue error');
        before(function() {
          sinon.stub(jobBrokerHelper.queue, 'queue').throws(queueError);
          sinon.stub(jobBrokerHelper, 'send');
          sinon.stub(jobBrokerHelper, 'ack');
          jobBrokerHelper.runningJobs.set(runningJob.id, runningJob);
          jobBrokerHelper.processDefault(job);
        });
        after(function() {
          jobBrokerHelper.queue.queue.restore();
          jobBrokerHelper.send.restore();
          jobBrokerHelper.ack.restore();
          jobBrokerHelper.runningJobs.clear();
        });
        it('should send finished state', function() {
          expect(jobBrokerHelper.send.calledWithExactly({
            nature: {
              type: 'state',
              quality: 'create',
            },
            payload: {
              jobid: job.id,
              state: 'finished',
              error: queueError,
              message: queueError.message,
            },
          })).to.equal(true);
        });
        it('should ack the job', function() {
          expect(jobBrokerHelper.ack.calledWithExactly(job)).to.equal(true);
        });
      });
    });
  });
});
