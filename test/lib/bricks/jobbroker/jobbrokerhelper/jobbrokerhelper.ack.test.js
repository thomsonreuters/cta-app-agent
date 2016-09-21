'use strict';
const appRootPath = require('app-root-path').path;
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
    const priorityA = jobA.payload.hasOwnProperty('priority') ? jobA.payload.priority : self.DEFAULTS.priority;
    const priorityB = jobB.payload.hasOwnProperty('priority') ? jobB.payload.priority : self.DEFAULTS.priority;
    if (priorityA === priorityB) return -1;
    return priorityA - priorityB;
  },
  strategy: JobQueue.ArrayStrategy,
};

describe('JobBroker - JobBrokerHelper - ack', function() {
  context('when the job to ack belongs to a running group job', function() {
    let jobBrokerHelper;
    const runningJobs = new Map();
    const jobQueue = new JobQueue(jobQueueOpts);
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    const groupJob = {
      id: 'some-groupjob-id',
      nature: {
        type: 'execution',
        quality: 'group',
      },
      payload: {
        queue: 'some-queue',
      },
    };
    const job = {
      id: 'some-job-id',
      nature: {
        type: 'execution',
        quality: 'bar',
      },
      payload: {
        groupjobid: groupJob.id,
      },
    };
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, 'send');
      sinon.stub(jobBrokerHelper.runningJobs, 'get').withArgs(job.payload.groupjobid).returns(groupJob);
      jobBrokerHelper.ack(job);
    });
    after(function() {
      jobBrokerHelper.send.restore();
      jobBrokerHelper.runningJobs.get.restore();
    });
    it('should call jobBrokerHelper send()', function() {
      const ackJob = {
        'nature': {
          'type': 'message',
          'quality': 'acknowledge',
        },
        'payload': {
          'id': job.id,
          'queue': groupJob.payload.queue,
        },
      };
      expect(jobBrokerHelper.send.calledWithExactly(ackJob)).to.equal(true);
    });
  });

  context('when the job to ack does not belong to a running group job', function() {
    let jobBrokerHelper;
    const runningJobs = new Map();
    const jobQueue = new JobQueue(jobQueueOpts);
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    const job = {
      id: 'some-job-id',
      nature: {
        type: 'foo',
        quality: 'bar',
      },
      payload: {},
    };
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
        'nature': {
          'type': 'message',
          'quality': 'acknowledge',
        },
        'payload': {
          'id': job.id,
        },
      };
      expect(jobBrokerHelper.send.calledWithExactly(ackJob)).to.equal(true);
    });
  });
});
