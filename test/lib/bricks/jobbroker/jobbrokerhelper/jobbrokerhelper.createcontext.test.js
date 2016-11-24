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
const ObjectID = require('bson').ObjectID;

const JobBrokerHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobbrokerhelper.js'));
const JobQueue = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobqueue.js'));
const jobQueueOpts = require('./jobqueueopts.testdata.js');
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();
const RunJob = require('./jobbrokerhelper.execution.run.testdata.js');
const ReadJob = require('./jobbrokerhelper.execution.read.testdata.js');

describe('JobBroker - JobBrokerHelper - createContext', function() {
  context('when job is execution-run', function() {
    let jobBrokerHelper;
    const runningJobs = {
      run: new Map(),
      read: new Map(),
      cancel: new Map(),
    };
    const jobQueue = new JobQueue(jobQueueOpts);
    const job = new RunJob();
    const mockContext = new EventEmitter();
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    const methodNameToCall = 'createContextForExecutionRun';
    let result;
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, methodNameToCall).returns(mockContext);
      result = jobBrokerHelper.createContext(job);
    });
    after(function() {
    });
    it('should create a new context with createContextForExecutionRun', function() {
      expect(jobBrokerHelper[methodNameToCall].calledWith(job)).to.equal(true);
    });
    it('should return cementHelper created context', function() {
      expect(result).to.deep.equal(mockContext);
    });
  });
  context('when job is execution-cancel', function() {
    let jobBrokerHelper;
    const runningJobs = {
      run: new Map(),
      read: new Map(),
      cancel: new Map(),
    };
    const jobQueue = new JobQueue(jobQueueOpts);
    const job = {
      id: new ObjectID(),
      nature: {
        type: 'execution',
        quality: 'cancel',
      },
      payload: {
      },
    };
    const mockContext = new EventEmitter();
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    const methodNameToCall = 'createContextForExecutionCancel';
    let result;
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, methodNameToCall).returns(mockContext);
      result = jobBrokerHelper.createContext(job);
    });
    after(function() {
    });
    it('should create a new context with createContextForExecutionRun', function() {
      expect(jobBrokerHelper[methodNameToCall].calledWith(job)).to.equal(true);
    });
    it('should return cementHelper created context', function() {
      expect(result).to.deep.equal(mockContext);
    });
  });
  context('when job is execution-read', function() {
    let jobBrokerHelper;
    const runningJobs = {
      run: new Map(),
      read: new Map(),
      cancel: new Map(),
    };
    const jobQueue = new JobQueue(jobQueueOpts);
    const job = new ReadJob();
    const mockContext = new EventEmitter();
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    const methodNameToCall = 'createContextForExecutionRead';
    let result;
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, methodNameToCall).returns(mockContext);
      result = jobBrokerHelper.createContext(job);
    });
    after(function() {
    });
    it('should create a new context with createContextForExecutionRead', function() {
      expect(jobBrokerHelper[methodNameToCall].calledWith(job)).to.equal(true);
    });
    it('should return cementHelper created context', function() {
      expect(result).to.deep.equal(mockContext);
    });
  });
  context('when job is message-get', function() {
    let jobBrokerHelper;
    const runningJobs = {
      run: new Map(),
      read: new Map(),
      cancel: new Map(),
    };
    const jobQueue = new JobQueue(jobQueueOpts);
    const job = {
      id: new ObjectID(),
      nature: {
        type: 'message',
        quality: 'get',
      },
      payload: {
      },
    };
    const mockContext = new EventEmitter();
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    const methodNameToCall = 'createContextForMessageGet';
    let result;
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, methodNameToCall).returns(mockContext);
      result = jobBrokerHelper.createContext(job);
    });
    after(function() {
    });
    it('should create a new context with createContextForMessageGet', function() {
      expect(jobBrokerHelper[methodNameToCall].calledWith(job)).to.equal(true);
    });
    it('should return cementHelper created context', function() {
      expect(result).to.deep.equal(mockContext);
    });
  });
  context('when job is state-create', function() {
    let jobBrokerHelper;
    const runningJobs = {
      run: new Map(),
      read: new Map(),
      cancel: new Map(),
    };
    const jobQueue = new JobQueue(jobQueueOpts);

    // input job
    const job = {
      nature: {
        type: 'state',
        quality: 'create',
      },
      payload: {
        state: 'finished',
      },
    };

    // expected job
    const now = Date.now();
    // const stateJob = _.cloneDeep(job);
    // stateJob.payload.ip = SystemDetails.ip;
    // stateJob.payload.hostname = SystemDetails.hostname;
    // stateJob.payload.timestamp = now;
    // const messageJob = {
    //   nature: {
    //     type: 'message',
    //     quality: 'produce',
    //   },
    //   payload: stateJob,
    // };

    const mockContext = new EventEmitter();
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    const methodNameToCall = 'createContextDefault';
    let result;
    before(function() {
      sinon.stub(Date, 'now').returns(now);
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, methodNameToCall).returns(mockContext);
      result = jobBrokerHelper.createContext(job);
    });
    after(function() {
      Date.now.restore();
    });
    it('should create a new context with createContextDefault', function() {
      sinon.assert.calledWith(jobBrokerHelper[methodNameToCall], job);
    });
    it('should return cementHelper created context', function() {
      expect(result).to.deep.equal(mockContext);
    });
  });
  context('when default case', function() {
    let jobBrokerHelper;
    const runningJobs = {
      run: new Map(),
      read: new Map(),
      cancel: new Map(),
    };
    const jobQueue = new JobQueue(jobQueueOpts);
    const job = {
      id: new ObjectID(),
      nature: {
        type: 'message',
        quality: 'acknowledge',
      },
      payload: {
      },
    };
    const mockContext = new EventEmitter();
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    const methodNameToCall = 'createContextDefault';
    let result;
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
      sinon.stub(jobBrokerHelper, methodNameToCall).returns(mockContext);
      result = jobBrokerHelper.createContext(job);
    });
    after(function() {
    });
    it('should create a new context with createContextForCommandline', function() {
      expect(jobBrokerHelper[methodNameToCall].calledWith(job)).to.equal(true);
    });
    it('should return cementHelper created context', function() {
      expect(result).to.deep.equal(mockContext);
    });
  });
});
