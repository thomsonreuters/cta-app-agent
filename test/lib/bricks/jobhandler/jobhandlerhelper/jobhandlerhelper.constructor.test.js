'use strict';

const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const JobHandlerHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/jobhandler/', 'jobhandlerhelper'));

describe('JobHandler - JobHandlerHelper - constructor', function() {
  context('when missing/incorrect \'executors\' Map argument', function() {
    it('should throw an error', function() {
      return expect(function() {
        return new JobHandlerHelper({});
      }).to.throw(Error, 'missing/incorrect \'executors\' Map argument');
    });
  });

  context('when missing/incorrect \'runningJobs\' Map argument', function() {
    it('should throw an error', function() {
      return expect(function() {
        return new JobHandlerHelper(new Map(), {});
      }).to.throw(Error, 'missing/incorrect \'runningJobs\' Map argument');
    });
  });

  context('when arguments are valid', function() {
    let jobHandlerHelper;
    const executors = new Map();
    const runningJobs = new Map();
    before(function() {
      jobHandlerHelper = new JobHandlerHelper(executors, runningJobs);
    });
    it('should return an JobHandlerHelper instance', function() {
      expect(jobHandlerHelper).to.be.an.instanceof(JobHandlerHelper);
    });

    it('should have a executors Map property', function() {
      expect(jobHandlerHelper).to.have.property('executors', executors);
    });

    it('should have a runningJobs Map property', function() {
      expect(jobHandlerHelper).to.have.property('runningJobs', runningJobs);
    });
  });
});
