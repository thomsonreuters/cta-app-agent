'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const ResultCollectorHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'resultcollectorhelper.js'));
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();

describe('ResultCollector - ResultCollectorHelper - constructor', function() {
  context('when missing/incorrect \'cementHelper\' CementHelper argument', function() {
    it('should throw an error', function() {
      return expect(function() {
        return new ResultCollectorHelper({}, DEFAULTLOGGER);
      }).to.throw(Error, 'missing/incorrect \'cementHelper\' CementHelper argument');
    });
  });

  context('when arguments are valid', function() {
    let jobBrokerHelper;
    const cementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    before(function() {
      jobBrokerHelper = new ResultCollectorHelper(cementHelper, DEFAULTLOGGER);
    });
    it('should return an JobHandlerHelper instance', function() {
      expect(jobBrokerHelper).to.be.an.instanceof(ResultCollectorHelper);
    });

    it('should have a cta-logger instance', function() {
      expect(jobBrokerHelper).to.have.property('logger', DEFAULTLOGGER);
    });

    it('should have a runningJob property set to null', function() {
      expect(jobBrokerHelper).to.have.property('runningJob', null);
    });
  });
});
