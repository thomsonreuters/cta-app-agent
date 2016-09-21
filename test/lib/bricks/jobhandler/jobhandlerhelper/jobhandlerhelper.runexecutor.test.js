'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');

const ObjectID = require('bson').ObjectID;
const _ = require('lodash');

const JobHandlerHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/jobhandler/', 'jobhandlerhelper'));

const JOB = {
  'nature': {
    'type': 'execution',
    'quality': 'bar',
  },
  'payload': {},
};

describe('JobHandler - JobHandlerHelper - runExecutor', function() {
  context('when specific executor process() succeeds (eg. callback with no error)', function() {
    let jobHandlerHelper;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    const executors = new Map();
    const runningJobs = new Map();
    let mockExecutor;
    const mockHandlerProcessStartResponse = {ok: 1};
    const mockHandlerProcessEndResponse = {ok: 1};
    before(function() {
      // mock jobHandlerHelper and its executors
      mockExecutor = {
        process: function(somejob, callback) {
          return new Promise((resolve) => {
            // resolve when process is started
            resolve(mockHandlerProcessStartResponse);

            // simulate a process being ran (waiting a delay), then callback when process is finished
            setTimeout(function() {
              callback(null, mockHandlerProcessEndResponse);
            }, 1000);
          });
        },
      };
      executors.set(job.nature.quality, mockExecutor);
      jobHandlerHelper = new JobHandlerHelper(executors, runningJobs);
    });

    it('should start and resolve, add job to runningJobs Map, finish and callback, remove job from Map', function(done) {
      const processPromise = jobHandlerHelper.runExecutor(mockExecutor, job, function onProcessFinished(error, response) {
        expect(error).to.be.a('null');
        expect(response).to.deep.equal(mockHandlerProcessEndResponse);
        expect(jobHandlerHelper.runningJobs.has(job.id)).to.equal(false);
        done();
      });
      expect(processPromise).to.eventually.equal(mockHandlerProcessStartResponse);
      expect(jobHandlerHelper.runningJobs.has(job.id)).to.equal(true);
      expect(jobHandlerHelper.runningJobs.get(job.id)).to.deep.equal(job);
    });
  });

  context('when specific executor process() ends with error (eg. callback with error)', function() {
    let jobHandlerHelper;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    const executors = new Map();
    const runningJobs = new Map();
    let mockExecutor;
    const mockHandlerProcessStartResponse = {ok: 1};
    const mockHandlerProcessEndResponse = new Error('mock process finish error');
    before(function() {
      // mock jobHandlerHelper and its executors
      mockExecutor = {
        process: function(somejob, callback) {
          return new Promise((resolve) => {
            // resolve when process is started
            resolve(mockHandlerProcessStartResponse);

            // simulate a process being ran (waiting a delay), then callback with error when process is finished
            setTimeout(function() {
              callback(mockHandlerProcessEndResponse);
            }, 1000);
          });
        },
      };
      executors.set(job.nature.quality, mockExecutor);
      jobHandlerHelper = new JobHandlerHelper(executors, runningJobs);
    });

    it('should start and resolve, add job to runningJobs Map, finish and callback with error, remove job from Map', function(done) {
      const processPromise = jobHandlerHelper.runExecutor(mockExecutor, job, function onProcessFinished(error) {
        expect(error).to.deep.equal(mockHandlerProcessEndResponse);
        expect(jobHandlerHelper.runningJobs.has(job.id)).to.equal(false);
        done();
      });
      expect(processPromise).to.eventually.equal(mockHandlerProcessStartResponse);
      expect(jobHandlerHelper.runningJobs.has(job.id)).to.equal(true);
      expect(jobHandlerHelper.runningJobs.get(job.id)).to.deep.equal(job);
    });
  });

  context('when specific executor process() fails to start (eg. reject)', function() {
    let jobHandlerHelper;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    const executors = new Map();
    const runningJobs = new Map();
    let mockExecutor;
    const mockHandlerProcessStartResponse = new Error('mock process start error');
    before(function() {
      // mock jobHandlerHelper and its executors
      mockExecutor = {
        process: function(somejob, callback) {
          return new Promise((resolve, reject) => {
            // reject
            reject(mockHandlerProcessStartResponse);
          });
        },
      };
      executors.set(job.nature.quality, mockExecutor);
      jobHandlerHelper = new JobHandlerHelper(executors, runningJobs);
    });

    it('should reject with provider process error at start', function(done) {
      jobHandlerHelper.runExecutor(mockExecutor, job).catch(function(err) {
        try {
          expect(err).to.deep.equal(mockHandlerProcessStartResponse);
          expect(jobHandlerHelper.runningJobs.has(job.id)).to.equal(false);
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });
});
