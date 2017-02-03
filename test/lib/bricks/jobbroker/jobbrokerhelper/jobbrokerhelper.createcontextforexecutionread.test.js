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
const ReadJob = require('./jobbrokerhelper.execution.read.testdata.js');

describe('JobBroker - JobBrokerHelper - createContextForExecutionRead', function() {
  let jobBrokerHelper;
  const runningJobs = {
    run: new Map(),
    read: new Map(),
    cancel: new Map(),
  };
  const jobQueue = new JobQueue(jobQueueOpts);
  const job = new ReadJob();
  const jobId = job.payload.execution.id;
  const queuegetjob = {
    nature: {
      type: 'messages',
      quality: 'get',
    },
    payload: {
      groupExecutionId: jobId,
      queue: job.payload.queue,
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
    sinon.stub(jobBrokerHelper.runningJobs.read, 'set');
    sinon.stub(jobBrokerHelper, 'createContextForMessageGet').returns(mockContext);
    sinon.spy(mockContext, 'once');
    result = jobBrokerHelper.createContextForExecutionRead(job);
  });
  after(function() {
    jobBrokerHelper.runningJobs.read.set.restore();
  });
  it('should add job to runningJobs read', function() {
    sinon.assert.calledWithExactly(jobBrokerHelper.runningJobs.read.set, jobId, job);
  });

  it('should create a new context using jobBrokerHelper.createContextForMessageGet', function() {
    sinon.assert.calledWithExactly(jobBrokerHelper.createContextForMessageGet, queuegetjob, queuegetopts);
  });

  it('should return created context', function() {
    expect(result).to.deep.equal(mockContext);
  });
});
