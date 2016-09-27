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
const SystemDetails = require(nodepath.join(appRootPath,
  '/lib/utils/systemdetails/', 'index.js'));
const jobQueueOpts = require('./jobqueueopts.testdata.js');
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();

describe('JobBroker - JobBrokerHelper - createContext', function() {
  context('when job is execution-commandline', function() {
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
    };
    const methodNameToCall = 'createContextForCommandline';
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
  context('when job is execution-cancelation', function() {
    let jobBrokerHelper;
    const runningJobs = new Map();
    const jobQueue = new JobQueue(jobQueueOpts);
    const job = {
      id: new ObjectID(),
      nature: {
        type: 'execution',
        quality: 'cancelation',
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
    const methodNameToCall = 'createContextForCommandline';
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
  context('when job is execution-group', function() {
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
      },
    };
    const mockContext = new EventEmitter();
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    const methodNameToCall = 'createContextForGroup';
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
  context('when job is message-get', function() {
    let jobBrokerHelper;
    const runningJobs = new Map();
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
    const methodNameToCall = 'createContextForQueueGet';
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
  context('when job is state-create', function() {
    let jobBrokerHelper;
    const runningJobs = new Map();
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
    const messageJob = {
      nature: {
        type: 'message',
        quality: 'produce',
      },
      payload: job,
    };
    messageJob.payload.ip = SystemDetails.ip;
    messageJob.payload.hosthame = SystemDetails.hostname;
    messageJob.payload.timestamp = now;

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
      sinon.assert.calledWith(jobBrokerHelper[methodNameToCall], messageJob);
    });
    it('should return cementHelper created context', function() {
      expect(result).to.deep.equal(mockContext);
    });
  });
  context('when default case', function() {
    let jobBrokerHelper;
    const runningJobs = new Map();
    const jobQueue = new JobQueue(jobQueueOpts);
    const job = {
      id: new ObjectID(),
      nature: {
        type: 'execution',
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
