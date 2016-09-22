'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const ObjectID = require('bson').ObjectID;

const Executor = require(nodepath.join(appRootPath,
  '/lib/bricks/jobhandler/executor/', 'executor'));
const logger = require('cta-logger');

let executor;
const STATES = {
  pending: 'pending',
  acked: 'acked',
  running: 'running',
  canceled: 'canceled',
  finished: 'finished',
};

const CANCELMODE = {
  MANUAL: 'MANUAL',
  JOBTIMEOUT: 'JOB TIMEOUT',
};
const DEFAULTS = {
  JOBTIMEOUT: 4000,
};
const DEFAULTLOGGER = logger();
before(function() {
  executor = new Executor(DEFAULTS, DEFAULTLOGGER);
});

describe('JobHandler - Executor - Base - constructor', function() {
  context('when incorrect \'JOBTIMEOUT\' number property in defaults', function() {
    const defaults = {
      JOBTIMEOUT: {},
    };
    it('should throw an error', function() {
      return expect(function() {
        return new Executor(defaults, DEFAULTLOGGER);
      }).to.throw(Error);
    });
  });

  context('when all options are valid', function() {
    it('should return a new Executor commandline instance', function(done) {
      expect(executor).to.be.an.instanceOf(Executor);
      expect(executor).to.have.property('runningJobs')
        .and.to.be.an('object');
      expect(executor).to.have.property('STATES').and.to.contain(STATES);
      expect(executor).to.have.property('CANCELMODE').and.to.contain(CANCELMODE);
      expect(executor).to.have.property('runningJobs')
        .and.to.be.an('object');
      expect(executor).to.have.property('DEFAULTS')
        .and.to.be.an('object');
      expect(executor.DEFAULTS).to.have.property('JOBTIMEOUT', DEFAULTS.JOBTIMEOUT);
      expect(executor).to.have.property('logger', DEFAULTLOGGER);
      done();
    });
  });
});

describe('JobHandler - Executor - Base - abstract methods', function() {
  describe('Executor Common - execute', function() {
    it('should throw an error', function() {
      return expect(function() {
        return executor._execute();
      }).to.throw(Error);
    });
  });

  describe('Executor Common - cancel', function() {
    it('should throw an error', function() {
      return expect(function() {
        return executor._cancel();
      }).to.throw(Error);
    });
  });
});
