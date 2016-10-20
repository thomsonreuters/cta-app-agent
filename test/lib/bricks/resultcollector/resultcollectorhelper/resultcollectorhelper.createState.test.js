'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');
const _ = require('lodash');

const EventEmitter = require('events').EventEmitter;

const ResultCollectorHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'resultcollectorhelper.js'));
const SystemDetails = require(nodepath.join(appRootPath,
  '/lib/utils/systemdetails/', 'index.js'));
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();

describe('ResultCollector - ResultCollectorHelper - createState', function() {
  context('when running job is null', function() {
    let helper;
    const body = {
      status: 'failed',
      executionId: 'id',
    };
    const inputContext = {
      data: {
        payload: body,
      },
      emit: sinon.stub(),
    };
    const mockCementHelper = {
      constructor: {
        name: 'CementHelper',
      },
      createContext: sinon.stub(),
    };

    before(function() {
      helper = new ResultCollectorHelper(mockCementHelper, DEFAULTLOGGER);
      helper.runningJob = null;
      helper.createState(inputContext);
    });
    after(function() {
    });

    it('should emit error  on inputContext', function() {
      sinon.assert.calledWithExactly(
        inputContext.emit,
        'error',
        helper.cementHelper.brickName,
        new Error('Creating State failed: no job currently running'));
    });
  });

  context('when running job has been set', function() {
    describe('when receiving a non-finished state', function() {
      let helper;
      const body = {
        status: 'running',
        executionId: 'id',
      };
      const inputContext = {
        data: {
          payload: body,
        },
        emit: sinon.stub(),
      };

      const currentIndex = 2;
      const runningJob = {
        executionId: 'id',
        testSuiteId: 'tsid',
        testId: 'tid',
        currentIndex: currentIndex,
      };

      const now = Date.now();
      const resultPayload = _.pick(body, ['status', 'executionId']);
      resultPayload.ip = SystemDetails.ip;
      resultPayload.hostname = SystemDetails.hostname;
      resultPayload.timestamp = now;
      const messageJob = {
        nature: {
          type: 'message',
          quality: 'produce',
        },
        payload: {
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: resultPayload,
        },
      };
      const mockContext = new EventEmitter();
      mockContext.publish = sinon.stub().returns(mockContext);
      const mockCementHelper = {
        constructor: {
          name: 'CementHelper',
        },
        createContext: sinon.stub().withArgs(messageJob).returns(mockContext),
      };

      before(function() {
        sinon.stub(Date, 'now').returns(now);
        helper = new ResultCollectorHelper(mockCementHelper, DEFAULTLOGGER);
        helper.runningJob = _.cloneDeep(runningJob);
        helper.createState(inputContext);
      });
      after(function() {
        Date.now.restore();
      });

      it('should create a new context with cementHelper', function() {
        sinon.assert.calledWithExactly(mockCementHelper.createContext, messageJob);
      });

      it('should publish the context', function() {
        sinon.assert.called(mockContext.publish);
      });

      describe('when context emit done event', function() {
        const response = { foo: 'bar' };
        before(function() {
          helper = new ResultCollectorHelper(mockCementHelper, DEFAULTLOGGER);
          helper.runningJob = _.cloneDeep(runningJob);
          helper.createResult(inputContext);
          mockContext.emit('done', 'sender', response);
        });
        after(function() {
          helper.runningJob = null;
        });
        it('should emit done on input context', function() {
          sinon.assert.calledWithExactly(inputContext.emit, 'done', helper.cementHelper.brickName, response);
        });
      });
    });

    describe('when receiving a finished state', function() {
      let helper;
      const body = {
        status: 'finished',
        executionId: 'id',
      };
      const inputContext = {
        data: {
          payload: body,
        },
        emit: sinon.stub(),
      };

      const currentIndex = 2;
      const runningJob = {
        executionId: 'id',
        testSuiteId: 'tsid',
        testId: 'tid',
        currentIndex: currentIndex,
      };

      const now = Date.now();
      const resultPayload = _.pick(body, ['status', 'executionId']);
      resultPayload.ip = SystemDetails.ip;
      resultPayload.hostname = SystemDetails.hostname;
      resultPayload.timestamp = now;
      resultPayload.index = runningJob.currentIndex;
      const messageJob = {
        nature: {
          type: 'message',
          quality: 'produce',
        },
        payload: {
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: resultPayload,
        },
      };
      const mockContext = new EventEmitter();
      mockContext.publish = sinon.stub().returns(mockContext);
      const mockCementHelper = {
        constructor: {
          name: 'CementHelper',
        },
        createContext: sinon.stub().withArgs(messageJob).returns(mockContext),
      };

      before(function() {
        sinon.stub(Date, 'now').returns(now);
        helper = new ResultCollectorHelper(mockCementHelper, DEFAULTLOGGER);
        helper.runningJob = _.cloneDeep(runningJob);
        helper.createState(inputContext);
      });
      after(function() {
        Date.now.restore();
      });

      it('should create a new context with cementHelper', function() {
        sinon.assert.calledWithExactly(mockCementHelper.createContext, messageJob);
      });

      it('should publish the context', function() {
        sinon.assert.called(mockContext.publish);
      });

      it('should set runningJob to null', function() {
        return expect(helper.runningJob).to.be.null;
      });

      describe('when context emit done event', function() {
        const response = { foo: 'bar' };
        before(function() {
          helper = new ResultCollectorHelper(mockCementHelper, DEFAULTLOGGER);
          helper.runningJob = _.cloneDeep(runningJob);
          helper.createResult(inputContext);
          mockContext.emit('done', 'sender', response);
        });
        after(function() {
          helper.runningJob = null;
        });
        it('should emit done on input context', function() {
          sinon.assert.calledWithExactly(inputContext.emit, 'done', helper.cementHelper.brickName, response);
        });
      });
    });
  });
});
