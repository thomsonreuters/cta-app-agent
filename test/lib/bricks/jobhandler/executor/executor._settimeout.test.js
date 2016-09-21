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
const DEFAULTS = {
  JOBTIMEOUT: 4000,
};
const DEFAULTLOGGER = logger();
before(function() {
  executor = new Executor(DEFAULTS, DEFAULTLOGGER);
});

describe('JobHandler - Executor - Base - _setTimeout', function() {
  context('when job is not running', function() {
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

    before(function(done) {
      if (executor.runningJobs.hasOwnProperty(job.id)) {
        delete executor.runningJobs[job.id];
      }
      done();
    });

    it('should reject with an error', function() {
      const setTimeoutPromise = executor._setTimeout(job.id, job.payload.timeout);
      return expect(setTimeoutPromise).to.eventually.be.rejectedWith(Error, `No job running with id ${job.id}`);
    });
  });

  context('when job is running', function() {
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

    before(function(done) {
      if (!executor.runningJobs.hasOwnProperty(job.id)) {
        executor.runningJobs[job.id] = {
          job: job,
        };
      }
      done();
    });

    it('should be fulfilled', function() {
      const setTimeoutPromise = executor._setTimeout(job.id, job.payload.timeout);
      return expect(setTimeoutPromise).to.eventually.be.fulfilled;
    });

    after(function(done) {
      if (executor.runningJobs.hasOwnProperty(job.id) && executor.runningJobs[job.id].hasOwnProperty('timeout')) {
        clearTimeout(executor.runningJobs[job.id].timeout);
        delete executor.runningJobs[job.id];
      }
      done();
    });
  });
});
