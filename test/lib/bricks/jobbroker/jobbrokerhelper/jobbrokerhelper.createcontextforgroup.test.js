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

describe('JobBroker - JobBrokerHelper - createContextForGroup', function() {
  let jobBrokerHelper;
  const runningJobs = new Map();
  const jobQueue = new JobQueue(jobQueueOpts);
  const job = {
    id: new ObjectID(),
    nature: {
      type: 'execution',
      quality: 'group',
    },
    payload: {
      queue: 'some-queue',
    },
  };
  const queuegetjob = {
    'nature': {
      'type': 'message',
      'quality': 'get',
    },
    'payload': {
      'groupjobid': job.id,
      'queue': job.payload.queue,
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
    sinon.stub(jobBrokerHelper.runningJobs, 'set');
    sinon.stub(jobBrokerHelper, 'createContextForQueueGet').returns(mockContext);
    sinon.spy(mockContext, 'once');
    result = jobBrokerHelper.createContextForGroup(job);
  });
  after(function() {
    jobBrokerHelper.runningJobs.set.restore();
  });
  it('should add job to runningJobs', function() {
    expect(jobBrokerHelper.runningJobs.set.calledWithExactly(job.id, job)).to.equal(true);
  });

  it('should create a new context using jobBrokerHelper.createContextQueueGet', function() {
    expect(jobBrokerHelper.createContextForQueueGet.calledWithExactly(queuegetjob, queuegetopts)).to.equal(true);
  });

  it('should return created context', function() {
    expect(result).to.deep.equal(mockContext);
  });
});
