'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
require('sinon-as-promised');

const ObjectID = require('bson').ObjectID;
const _ = require('lodash');

const JobHandlerHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/jobhandler/', 'jobhandlerhelper'));

const JOB = {
  nature: {
    type: 'execution',
    quality: 'bar',
  },
  payload: {},
};

describe('JobHandler - JobHandlerHelper - getExecutor', function() {
  context('when job quality is not cancelation', function() {
    let jobHandlerHelper;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    const executors = new Map();
    const runningJobs = new Map();
    const mockExecutor = {
      mockQuality: job.nature.quality,
    };
    before(function() {
      executors.set(job.nature.quality, mockExecutor);
      jobHandlerHelper = new JobHandlerHelper(executors, runningJobs);
    });
    it('should return right executor', function() {
      const executor = jobHandlerHelper.getExecutor(job);
      expect(executor).to.be.deep.equal(mockExecutor);
    });
  });

  context('when job quality is cancel', function() {
    context('when job to cancel is running', function() {
      let jobHandlerHelper;
      const runningJob = _.cloneDeep(JOB);
      runningJob.id = new ObjectID();
      const job = _.cloneDeep(JOB);
      job.id = new ObjectID();
      job.nature.quality = 'cancel';
      job.payload.jobid = runningJob.id;
      const executors = new Map();
      const runningJobs = new Map();
      const mockExecutor = {
        mockQuality: runningJob.nature.quality,
      };
      before(function() {
        runningJobs.set(runningJob.id, runningJob);
        executors.set(runningJob.nature.quality, mockExecutor);
        jobHandlerHelper = new JobHandlerHelper(executors, runningJobs);
      });
      it('should return right executor', function() {
        const executor = jobHandlerHelper.getExecutor(job);
        expect(executor).to.be.deep.equal(mockExecutor);
      });
    });

    context('when job to cancel is not running', function() {
      let jobHandlerHelper;
      const runningJob = _.cloneDeep(JOB);
      runningJob.id = new ObjectID();
      const job = _.cloneDeep(JOB);
      job.id = new ObjectID();
      job.nature.quality = 'cancelation';
      job.payload.jobid = 'not-a-running-job-id';
      const executors = new Map();
      const runningJobs = new Map();
      const mockExecutor = {
        mockQuality: runningJob.nature.quality,
      };
      before(function() {
        runningJobs.set(runningJob.id, runningJob);
        executors.set(runningJob.nature.quality, mockExecutor);
        jobHandlerHelper = new JobHandlerHelper(executors, runningJobs);
      });
      it('should return undefined', function() {
        const executor = jobHandlerHelper.getExecutor(job);
        return expect(executor).to.be.undefined;
      });
    });
  });
});
