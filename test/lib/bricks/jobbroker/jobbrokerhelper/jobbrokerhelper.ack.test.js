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
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();
const jobQueueOpts = {
  comparator: function comparator(jobA, jobB) {
    const that = this;
    const priorityA = jobA.payload.hasOwnProperty('priority') ? jobA.payload.priority : that.DEFAULTS.priority;
    const priorityB = jobB.payload.hasOwnProperty('priority') ? jobB.payload.priority : that.DEFAULTS.priority;
    if (priorityA === priorityB) return -1;
    return priorityA - priorityB;
  },
  strategy: JobQueue.ArrayStrategy,
};
const RunJob = require('./jobbrokerhelper.execution.run.testdata.js');
const ReadJob = require('./jobbrokerhelper.execution.read.testdata.js');

describe('JobBroker - JobBrokerHelper - ack', function() {
  context('when the job to ack belongs to a running group job', function() {
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
    };
    const groupJob = new ReadJob();
    const job = new RunJob();
    job.id = 'some-message-id';
    job.payload.execution.id = groupJob.payload.execution.id;
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper.runningJobs.read, 'get').withArgs(job.payload.execution.id).returns(groupJob);
      jobBrokerHelper.ack(job);
    });
    after(function() {
      jobBrokerHelper.send.restore();
      jobBrokerHelper.runningJobs.read.get.restore();
    });
    it('should call jobBrokerHelper send()', function() {
      const ackJob = {
        nature: {
          type: 'messages',
          quality: 'acknowledge',
        },
        payload: {
          id: job.id,
          queue: groupJob.payload.queue,
        },
      };
      expect(jobBrokerHelper.send.calledWithExactly(ackJob)).to.equal(true);
    });
  });

  context('when the job to ack does not belong to a running group job', function() {
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
    };
    const job = new RunJob();
    job.id = 'some-message-id';
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, 'send');
      jobBrokerHelper.ack(job);
    });
    after(function() {
      jobBrokerHelper.send.restore();
    });
    it('should call jobBrokerHelper send()', function() {
      const ackJob = {
        nature: {
          type: 'messages',
          quality: 'acknowledge',
        },
        payload: {
          id: job.id,
        },
      };
      expect(jobBrokerHelper.send.calledWithExactly(ackJob)).to.equal(true);
    });
  });
});
