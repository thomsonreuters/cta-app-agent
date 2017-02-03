'use strict';

const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');
const ObjectId = require('bson').ObjectId;

const ResultCollectorHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'resultcollectorhelper.js'));
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();

describe('ResultCollector - ResultCollectorHelper - setRunningJob', function() {
  let helper;
  const job = {
    executionId: (new ObjectId()).toString(),
    testSuiteId: (new ObjectId()).toString(),
    testId: (new ObjectId()).toString(),
  };
  const inputContext = {
    data: {
      payload: job,
    },
    emit: sinon.stub(),
  };
  const mockCementHelper = {
    constructor: {
      name: 'CementHelper',
    },
  };

  before(function() {
    helper = new ResultCollectorHelper(mockCementHelper, DEFAULTLOGGER);
  });
  after(function() {
  });

  context('when helper.runningJob is null', function() {
    before(function() {
      helper.setRunningJob(inputContext);
    });
    it('should set runningJob', function() {
      expect(helper.runningJob).to.have.property('executionId', job.executionId);
      expect(helper.runningJob).to.have.property('testSuiteId', job.testSuiteId);
      expect(helper.runningJob).to.have.property('testId', job.testId);
      expect(helper.runningJob).to.have.property('currentIndex', 0);
      expect(helper.runningJob).to.have.property('active', true);
    });

    it('should emit done on input context', function() {
      sinon.assert.calledWithExactly(inputContext.emit, 'done', helper.cementHelper.brickName);
    });
  });

  context('when helper.runningJob has different executionId', function() {
    const alreadySetJob = {
      executionId: (new ObjectId()).toString(),
      testSuiteId: (new ObjectId()).toString(),
      testId: (new ObjectId()).toString(),
      currentIndex: 0,
    };
    before(function() {
      helper.runningJob = alreadySetJob;
      helper.setRunningJob(inputContext);
    });
    it('should replace runningJob', function() {
      expect(helper.runningJob).to.have.property('executionId', job.executionId);
      expect(helper.runningJob).to.have.property('testSuiteId', job.testSuiteId);
      expect(helper.runningJob).to.have.property('testId', job.testId);
      expect(helper.runningJob).to.have.property('currentIndex', 0);
      expect(helper.runningJob).to.have.property('active', true);
    });

    it('should emit done on input context', function() {
      sinon.assert.calledWithExactly(inputContext.emit, 'done', helper.cementHelper.brickName);
    });
  });

  context('when helper.runningJob has same executionId', function() {
    const alreadySetJob = {
      executionId: job.executionId,
      testSuiteId: (new ObjectId()).toString(),
      testId: (new ObjectId()).toString(),
      currentIndex: 5,
    };
    before(function() {
      helper.runningJob = alreadySetJob;
      helper.setRunningJob(inputContext);
    });
    it('should update testSuiteId and testId fields only', function() {
      expect(helper.runningJob).to.have.property('executionId', alreadySetJob.executionId);
      expect(helper.runningJob).to.have.property('testSuiteId', job.testSuiteId);
      expect(helper.runningJob).to.have.property('testId', job.testId);
      expect(helper.runningJob).to.have.property('currentIndex', alreadySetJob.currentIndex);
      expect(helper.runningJob).to.have.property('active', true);
    });

    it('should emit done on input context', function() {
      sinon.assert.calledWithExactly(inputContext.emit, 'done', helper.cementHelper.brickName);
    });
  });
});
