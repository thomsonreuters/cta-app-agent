'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const JobBrokerHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobbrokerhelper.js'));
const JobQueue = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobqueue.js'));
const jobQueueOpts = require('./jobqueueopts.testdata.js');
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();

describe('JobBroker - JobBrokerHelper - constructor', function() {
  context('when missing/incorrect \'cementHelper\' CementHelper argument', function() {
    it('should throw an error', function() {
      return expect(function() {
        return new JobBrokerHelper({}, new JobQueue(jobQueueOpts), new Map(), DEFAULTLOGGER);
      }).to.throw(Error, 'missing/incorrect \'cementHelper\' CementHelper argument');
    });
  });

  context('when missing/incorrect \'queue\' JobQueue argument', function() {
    const cementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    it('should throw an error', function() {
      return expect(function() {
        return new JobBrokerHelper(cementHelper, new Map(), DEFAULTLOGGER);
      }).to.throw(Error, 'missing/incorrect \'queue\' JobQueue argument');
    });
  });

  context('when missing/incorrect \'runningJobs\' Map argument', function() {
    const cementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    it('should throw an error', function() {
      return expect(function() {
        return new JobBrokerHelper(cementHelper, new JobQueue(jobQueueOpts), '', DEFAULTLOGGER);
      }).to.throw(Error, 'missing/incorrect \'runningJobs\' Object argument');
    });
  });

  context('when arguments are valid', function() {
    let jobBrokerHelper;
    const runningJobs = {
      run: new Map(),
      read: new Map(),
      cancel: new Map(),
    };
    const jobQueue = new JobQueue(jobQueueOpts);
    const cementHelper = {
      constructor: {
        name: 'CementHelper',
      },
    };
    before(function() {
      jobBrokerHelper = new JobBrokerHelper(cementHelper, jobQueue, runningJobs, DEFAULTLOGGER);
    });
    it('should return an JobHandlerHelper instance', function() {
      expect(jobBrokerHelper).to.be.an.instanceof(JobBrokerHelper);
    });

    it('should have a queue JobQueue property', function() {
      expect(jobBrokerHelper).to.have.property('cementHelper', cementHelper);
    });

    it('should have a queue JobQueue property', function() {
      expect(jobBrokerHelper).to.have.property('queue', jobQueue);
    });

    it('should have a runningJobs Map property', function() {
      expect(jobBrokerHelper).to.have.property('runningJobs', runningJobs);
    });

    it('should have a cta-logger instance', function() {
      expect(jobBrokerHelper).to.have.property('logger', DEFAULTLOGGER);
    });
  });
});
