'use strict';

const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const sinon = require('sinon');
require('sinon-as-promised');

const ResultCollector = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'resultcollector.js'));
const DEFAULTS = {
  name: 'jobbroker',
  module: 'cta-jobbroker',
  properties: {
    priority: 100,
  },
};

describe('ResultCollector - process', function() {
  let resultCollector;
  const mockCementHelper = {
    constructor: {
      name: 'CementHelper',
    },
    brickName: 'resultCollector',
  };
  before(function() {
    resultCollector = new ResultCollector(mockCementHelper, DEFAULTS);
  });

  context('when job.nature.type is result', function() {
    context('when job.nature.quality is create', function() {
      const quality = 'create';
      const methodName = 'createResult';
      const job = {
        nature: {
          type: 'result',
          quality: quality,
        },
        payload: {},
      };
      const context = { data: job };
      before(function() {
        sinon.stub(resultCollector.resultCollectorHelper, methodName);
        resultCollector.process(context);
      });
      after(function() {
        resultCollector.resultCollectorHelper[methodName].restore();
      });
      it(`should call jobBrokerHelper.${methodName}`, function() {
        sinon.assert.calledWithExactly(resultCollector.resultCollectorHelper[methodName], context);
      });
    });

    context('when job.nature.quality is setRunningJob', function() {
      const quality = 'setRunningJob';
      const methodName = 'setRunningJob';
      const job = {
        nature: {
          type: 'result',
          quality: quality,
        },
        payload: {},
      };
      const context = { data: job };
      before(function() {
        sinon.stub(resultCollector.resultCollectorHelper, methodName);
        resultCollector.process(context);
      });
      after(function() {
        resultCollector.resultCollectorHelper[methodName].restore();
      });
      it(`should call jobBrokerHelper.${methodName}`, function() {
        sinon.assert.calledWithExactly(resultCollector.resultCollectorHelper[methodName], context);
      });
    });
  });

  context('when job.nature.type is state', function() {
    context('when job.nature.quality is create', function() {
      const quality = 'create';
      const methodName = 'createState';
      const job = {
        nature: {
          type: 'states',
          quality: quality,
        },
        payload: {},
      };
      const context = { data: job };
      before(function() {
        sinon.stub(resultCollector.resultCollectorHelper, methodName);
        resultCollector.process(context);
      });
      after(function() {
        resultCollector.resultCollectorHelper[methodName].restore();
      });
      it(`should call jobBrokerHelper.${methodName}`, function() {
        sinon.assert.calledWithExactly(resultCollector.resultCollectorHelper[methodName], context);
      });
    });
  });
});

