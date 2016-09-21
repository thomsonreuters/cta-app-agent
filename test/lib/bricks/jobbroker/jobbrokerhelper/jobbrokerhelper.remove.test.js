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
const jobQueueOpts = require('./jobqueueopts.testdata.js');
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();

describe('JobBroker - JobBrokerHelper - remove', function() {
  context('job is present in runningJobs Map', function() {
    context('jobQueue is empty or another job is still running', function() {
      let jobBrokerHelper;
      const runningJobs = new Map();
      const jobQueue = new JobQueue(jobQueueOpts);
      const mockCementHelper = {
        constructor: {
          name: 'CementHelper',
        },
      };
      const jobid = 'some-job-id';
      before(function() {
        jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
        sinon.spy(jobBrokerHelper.logger, 'warn');
        sinon.stub(jobBrokerHelper.runningJobs, 'delete').returns({});
        sinon.stub(jobBrokerHelper.queue, 'isEmpty').returns(false);
        sinon.stub(jobBrokerHelper.queue, 'dequeue');
        sinon.stub(jobBrokerHelper, 'send');
        jobBrokerHelper.remove(jobid);
      });
      after(function() {
        jobBrokerHelper.logger.warn.restore();
        jobBrokerHelper.runningJobs.delete.restore();
        jobBrokerHelper.queue.isEmpty.restore();
        jobBrokerHelper.queue.dequeue.restore();
        jobBrokerHelper.send.restore();
      });
      it('should call queue delete()', function() {
        expect(jobBrokerHelper.runningJobs.delete.calledWithExactly(jobid)).to.equal(true);
      });

      it('should not call queue dequeue()', function() {
        expect(jobBrokerHelper.queue.dequeue.called).to.equal(false);
      });

      it('should not call jobBrokerHelper send()', function() {
        expect(jobBrokerHelper.send.called).to.equal(false);
      });
    });

    context('jobQueue is not empty and no job is still running', function() {
      let jobBrokerHelper;
      const runningJobs = new Map();
      const jobQueue = new JobQueue(jobQueueOpts);
      const mockCementHelper = {
        constructor: {
          name: 'CementHelper',
        },
      };
      const jobid = 'some-job-id';
      const mockDequeuedJob = { 'id': 'bar' };
      before(function() {
        jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
        sinon.spy(jobBrokerHelper.logger, 'warn');
        sinon.stub(jobBrokerHelper.runningJobs, 'delete').returns({});
        jobBrokerHelper.runningJobs.clear();
        sinon.stub(jobBrokerHelper.queue, 'isEmpty').returns(true);
        sinon.stub(jobBrokerHelper.queue, 'dequeue').returns(mockDequeuedJob);
        sinon.stub(jobBrokerHelper, 'send');
        jobBrokerHelper.remove(jobid);
      });
      after(function() {
        jobBrokerHelper.logger.warn.restore();
        jobBrokerHelper.runningJobs.delete.restore();
        jobBrokerHelper.queue.isEmpty.restore();
        jobBrokerHelper.queue.dequeue.restore();
        jobBrokerHelper.send.restore();
      });
      it('should call queue delete()', function() {
        expect(jobBrokerHelper.runningJobs.delete.calledWithExactly(jobid)).to.equal(true);
      });

      it('should call queue dequeue()', function() {
        expect(jobBrokerHelper.queue.dequeue.called).to.equal(true);
      });

      it('should call jobBrokerHelper send()', function() {
        expect(jobBrokerHelper.send.calledWithExactly(mockDequeuedJob)).to.equal(true);
      });
    });
  });

  context('job is absent in runningJobs Map', function() {
    let jobBrokerHelper;
    const runningJobs = new Map();
    const jobQueue = new JobQueue(jobQueueOpts);
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    const jobid = 'some-job-id';
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.spy(jobBrokerHelper.logger, 'warn');
      sinon.stub(jobBrokerHelper.runningJobs, 'delete').returns(undefined);
      jobBrokerHelper.remove(jobid);
    });
    after(function() {
      jobBrokerHelper.logger.warn.restore();
    });
    it('should call queue delete()', function() {
      expect(jobBrokerHelper.runningJobs.delete.calledWithExactly(jobid)).to.equal(true);
    });

    it('should call logger warn()', function() {
      expect(jobBrokerHelper.logger.warn.calledWith(`tried to remove an unknown running job (id: ${jobid}).`)).to.equal(true);
    });
  });
});
