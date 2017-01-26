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
const jobQueueOpts = require('./jobqueueopts.testdata.js');
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();
const RunJob = require('./jobbrokerhelper.execution.run.testdata.js');

describe('JobBroker - JobBrokerHelper - remove', function() {
  context('job is present in runningJobs Map', function() {
    context('jobQueue is empty or another job is still running', function() {
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
      before(function() {
        jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
        sinon.spy(jobBrokerHelper.logger, 'warn');
        sinon.stub(jobBrokerHelper.runningJobs[job.nature.quality], 'has').withArgs(job.payload.execution.id).returns(true);
        sinon.stub(jobBrokerHelper.runningJobs[job.nature.quality], 'get').withArgs(job.payload.execution.id).returns(job);
        sinon.stub(jobBrokerHelper.runningJobs[job.nature.quality], 'delete').returns(job);
        sinon.stub(jobBrokerHelper.queue, 'isEmpty').returns(false);
        sinon.stub(jobBrokerHelper.queue, 'dequeue');
        sinon.stub(jobBrokerHelper, 'send');
        sinon.stub(jobBrokerHelper, 'setRunningTimeout');
        jobBrokerHelper.remove(job);
      });
      after(function() {
        jobBrokerHelper.logger.warn.restore();
        jobBrokerHelper.runningJobs[job.nature.quality].delete.restore();
        jobBrokerHelper.runningJobs[job.nature.quality].has.restore();
        jobBrokerHelper.runningJobs[job.nature.quality].get.restore();
        jobBrokerHelper.queue.isEmpty.restore();
        jobBrokerHelper.queue.dequeue.restore();
        jobBrokerHelper.send.restore();
        jobBrokerHelper.setRunningTimeout.restore();
      });
      it('should call queue delete()', function() {
        expect(jobBrokerHelper.runningJobs[job.nature.quality].delete.calledWithExactly(job.payload.execution.id)).to.equal(true);
      });

      it('should not call queue dequeue()', function() {
        expect(jobBrokerHelper.queue.dequeue.called).to.equal(false);
      });

      it('should not call jobBrokerHelper send()', function() {
        expect(jobBrokerHelper.send.called).to.equal(false);
      });

      it('should not call jobBrokerHelper setRunningTimeout()', function() {
        expect(jobBrokerHelper.setRunningTimeout.called).to.equal(false);
      });
    });

    context('jobQueue is not empty and no job is still running', function() {
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
      const mockDequeuedJob = new RunJob();
      before(function() {
        jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
        sinon.spy(jobBrokerHelper.logger, 'warn');
        sinon.stub(jobBrokerHelper.runningJobs[job.nature.quality], 'has').withArgs(job.payload.execution.id).returns(true);
        sinon.stub(jobBrokerHelper.runningJobs[job.nature.quality], 'get').withArgs(job.payload.execution.id).returns(job);
        sinon.stub(jobBrokerHelper.runningJobs[job.nature.quality], 'delete').returns(job);
        jobBrokerHelper.runningJobs[job.nature.quality].clear();
        sinon.stub(jobBrokerHelper.queue, 'isEmpty').returns(true);
        sinon.stub(jobBrokerHelper.queue, 'dequeue').returns(mockDequeuedJob);
        sinon.stub(jobBrokerHelper, 'send');
        sinon.stub(jobBrokerHelper, 'setRunningTimeout');
        jobBrokerHelper.remove(job);
      });
      after(function() {
        jobBrokerHelper.logger.warn.restore();
        jobBrokerHelper.runningJobs[job.nature.quality].delete.restore();
        jobBrokerHelper.runningJobs[job.nature.quality].has.restore();
        jobBrokerHelper.runningJobs[job.nature.quality].get.restore();
        jobBrokerHelper.queue.isEmpty.restore();
        jobBrokerHelper.queue.dequeue.restore();
        jobBrokerHelper.send.restore();
        jobBrokerHelper.setRunningTimeout.restore();
      });
      it('should call queue delete()', function() {
        expect(jobBrokerHelper.runningJobs[job.nature.quality].delete.calledWithExactly(job.payload.execution.id)).to.equal(true);
      });

      it('should call queue dequeue()', function() {
        expect(jobBrokerHelper.queue.dequeue.called).to.equal(true);
      });

      it('should call jobBrokerHelper send()', function() {
        expect(jobBrokerHelper.send.calledWithExactly(mockDequeuedJob)).to.equal(true);
      });

      it('should call jobBrokerHelper setRunningTimeout()', function() {
        expect(jobBrokerHelper.setRunningTimeout.calledWithExactly(mockDequeuedJob)).to.equal(true);
      });
    });
  });

  context('job is absent in runningJobs Map', function() {
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
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.spy(jobBrokerHelper.logger, 'warn');
      jobBrokerHelper.remove(job);
    });
    after(function() {
      jobBrokerHelper.logger.warn.restore();
    });

    it('should call logger warn()', function() {
      expect(jobBrokerHelper.logger.warn.calledWith(
        `tried to remove an unknown running ${job.nature.quality} job (id: ${job.payload.execution.id}).`,
      )).to.equal(true);
    });
  });
});
