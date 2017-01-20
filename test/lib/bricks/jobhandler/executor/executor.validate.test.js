'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
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
          type: 'executions',
          quality: 'commandLine',
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
          type: 'executions',
          quality: 'commandLine',
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
  context('when missing/incorrect \'jobid\' ObjectID property in cancel job.payload', function() {
    it('should throw an error', function() {
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'executions',
          quality: 'cancel',
        },
        payload: {
          jobid: {},
        },
      };
      const validatePromise = executor.validate(job);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'jobid\' ObjectID property in cancel job.payload');
    });
  });

  context('when incorrect \'mode\' String property in cancel job.payload', function() {
    it('should throw an error', function() {
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'executions',
          quality: 'cancel',
        },
        payload: {
          jobid: new ObjectID(),
          mode: {},
        },
      };
      const validatePromise = executor.validate(job);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'incorrect \'mode\' String property in cancel job.payload');
    });
  });
});
