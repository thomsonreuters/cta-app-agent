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

describe('JobBroker - JobBrokerHelper - send', function() {
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
    payload: {
    },
  };
  const mockContext = {
    publish() {
      return this;
    },
  };
  let result;
  before(function() {
    sinon.spy(mockContext, 'publish');
    jobBrokerHelper = new JobBrokerHelper(mockCementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
    sinon.stub(jobBrokerHelper, 'createContext').returns(mockContext);
    result = jobBrokerHelper.send(job);
  });
  after(function() {
    jobBrokerHelper.createContext.restore();
  });
  it('should call jobBrokerHelper createContext()', function() {
    expect(jobBrokerHelper.createContext.calledWithExactly(job)).to.equal(true);
  });

  it('should call mockContext publish()', function() {
    expect(mockContext.publish.called).to.equal(true);
  });

  it('should return mockContext', function() {
    expect(result).to.deep.equal(mockContext);
  });
});
