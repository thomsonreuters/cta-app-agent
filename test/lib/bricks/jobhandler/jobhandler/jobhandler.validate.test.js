'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');

const ObjectID = require('bson').ObjectID;
const _ = require('lodash');

const JobHandler = require(nodepath.join(appRootPath,
  '/lib/bricks/jobhandler/', 'index'));
const JobHandlerHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/jobhandler/', 'jobhandlerhelper'));

const JOB = {
  nature: {
    type: 'execution',
    quality: 'bar',
  },
  payload: {},
};

const DEFAULTS = {
  name: 'jobhandler',
  module: 'cta-jobhandler',
  properties: {
    COMMANDLINE: {
      JOBTIMEOUT: 5000,
      CMDTIMEOUT: 5000,
    },
  },
};

describe('Module loading', function() {
  let jobHandler;
  before(function() {
    jobHandler = new JobHandler({}, DEFAULTS);
  });

  it('should return new jobHandler object', function(done) {
    expect(jobHandler).to.be.an.instanceof(JobHandler);
    expect(jobHandler).to.have.property('executors').and.to.be.a('Map');
    expect(jobHandler).to.have.property('runningJobs').and.to.be.a('Map');
    expect(jobHandler).to.have.property('jobHandlerHelper').and.to.be.an.instanceof(JobHandlerHelper);
    done();
  });
});

describe('JobHandler - validate', function() {
  context('when missing/incorrect \'id\' string property in job', function() {
    let jobHandler;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    let context;
    before(function() {
      jobHandler = new JobHandler({}, DEFAULTS);
      delete job.id;
      context = { data: job };
    });

    it('should throw an error', function() {
      const validatePromise = jobHandler.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'id\' ObjectID property in job');
    });
  });

  context('when job type is not supported', function() {
    let jobHandler;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    job.nature.type = 'notexecution';
    let context;
    before(function() {
      jobHandler = new JobHandler({}, DEFAULTS);
      context = { data: job };
    });

    it('should throw an error', function() {
      const validatePromise = jobHandler.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'type ' + job.nature.type + ' not supported');
    });
  });

  context('when job quality is not supported', function() {
    let jobHandler;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    let context;
    before(function() {
      jobHandler = new JobHandler({}, DEFAULTS);
      context = { data: job };
      sinon.stub(jobHandler.executors, 'has').withArgs(job.nature.quality).returns(false);
    });
    after(function() {
      jobHandler.executors.has.restore();
    });

    it('should throw an error', function() {
      const validatePromise = jobHandler.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'quality ' + job.nature.quality + ' not supported');
    });
  });

  context('when specific executor validate() rejects', function() {
    let jobHandler;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    let context;
    let mockHandler;
    const mockHandlerValidateResponse = new Error('mock executor validate error');
    before(function() {
      jobHandler = new JobHandler({}, DEFAULTS);
      context = { data: job };

      // mock jobHandler and its providers
      jobHandler = new JobHandler({}, DEFAULTS);
      mockHandler = {
        validate: function() {
          return new Promise((resolve, reject) => {
            // resolve when process is started
            reject(mockHandlerValidateResponse);
          });
        },
      };
      jobHandler.executors.set(job.nature.quality, mockHandler);
    });

    it('should reject with executor validate error', function() {
      const validatePromise = jobHandler.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(mockHandlerValidateResponse);
    });
  });

  context('when job is valid', function() {
    let jobHandler;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    let context;
    let mockHandler;
    const mockHandlerValidateResponse = { ok: 1 };
    before(function() {
      jobHandler = new JobHandler({}, DEFAULTS);
      context = { data: job };

      // mock jobHandler and its providers
      jobHandler = new JobHandler({}, DEFAULTS);
      mockHandler = {
        validate: function() {
          return new Promise((resolve) => {
            // resolve when process is started
            resolve(mockHandlerValidateResponse);
          });
        },
      };
      jobHandler.executors.set(job.nature.quality, mockHandler);
    });

    it('should resolve', function() {
      const validatePromise = jobHandler.validate(context);
      return expect(validatePromise).to.eventually.be.an('object')
        .and.to.have.property('ok', 1);
    });
  });

  context('when job is cancelation type', function() {
    context('when missing/incorrect \'jobid\' string property in job payload', function() {
      let jobHandler;
      const job = _.cloneDeep(JOB);
      job.id = new ObjectID();
      let context;
      before(function() {
        jobHandler = new JobHandler({}, DEFAULTS);
        job.nature.quality = 'cancel';
        job.payload.jobid = {};
        context = { data: job };
        sinon.stub(jobHandler.executors, 'has').withArgs(job.nature.quality).returns(true);
      });
      after(function() {
        jobHandler.executors.has.restore();
      });
      it('should throw an error', function() {
        const validatePromise = jobHandler.validate(context);
        return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'jobid\' ObjectID property in job payload');
      });
    });

    context('when cancelation is valid', function() {
      let jobHandler;
      const job = _.cloneDeep(JOB);
      job.id = new ObjectID();
      let context;
      before(function() {
        jobHandler = new JobHandler({}, DEFAULTS);
        job.nature.quality = 'cancel';
        job.payload.jobid = new ObjectID();
        context = { data: job };
        sinon.stub(jobHandler.executors, 'has').withArgs(job.nature.quality).returns(true);
      });
      after(function() {
        jobHandler.executors.has.restore();
      });

      it('should return ok', function() {
        const validatePromise = jobHandler.validate(context);
        return expect(validatePromise).to.eventually.be.an('object')
          .and.to.have.property('ok', 1);
      });
    });
  });
});
