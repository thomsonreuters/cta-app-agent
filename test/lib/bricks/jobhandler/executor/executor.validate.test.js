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

describe('JobHandler - Executor - Base - validate - default job', function() {
  context('when incorrect \'timeout\' number property in job payload', function() {
    it('should throw an error', function() {
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandline',
        },
        payload: {
          timeout: {},
        },
      };
      const validatePromise = executor.validate(job);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'incorrect \'timeout\' number property in job payload');
    });
  });

  context('when execution is valid', function() {
    it('should return ok', function(done) {
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandline',
        },
        payload: {
          timeout: 20,
        },
      };
      const validatePromise = executor.validate(job);
      expect(validatePromise).to.eventually.be.an('object')
        .and.to.have.property('ok', 1);
      done();
    });
  });
});

describe('JobHandler - Executor - Base - validate - cancelation job', function() {
  context('when missing/incorrect \'jobid\' ObjectID property in cancelation job.payload', function() {
    it('should throw an error', function() {
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'cancelation',
        },
        payload: {
          jobid: {},
        },
      };
      const validatePromise = executor.validate(job);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'jobid\' ObjectID property in cancelation job.payload');
    });
  });

  context('when incorrect \'mode\' String property in cancelation job.payload', function() {
    it('should throw an error', function() {
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'cancelation',
        },
        payload: {
          jobid: new ObjectID(),
          mode: {},
        },
      };
      const validatePromise = executor.validate(job);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'incorrect \'mode\' String property in cancelation job.payload');
    });
  });
});
