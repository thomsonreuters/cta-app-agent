'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');

const ObjectID = require('bson').ObjectID;
const _ = require('lodash');

const JobHandler = require(nodepath.join(appRootPath,
  '/lib/bricks/jobhandler/', 'index'));

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

describe('JobHandler - process', function() {
  context('when job quality is cancelation but job to cancel is not running', function() {
    let jobHandler;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();

    const cancelJob = _.cloneDeep(JOB);
    cancelJob.id = new ObjectID();
    cancelJob.nature.quality = 'cancel';
    cancelJob.payload.jobid = job.id;
    let context;
    before(function() {
      // mock context data and emit method
      context = {
        data: cancelJob,
        emit: sinon.stub(),
      };

      // mock jobHandler
      jobHandler = new JobHandler({}, DEFAULTS);
      jobHandler.runningJobs.clear();
      jobHandler.process(context);
    });

    it('should emit done events', function() {
      const response = {
        ok: 1,
        state: 'finished',
        message: `Cancelation job ${cancelJob.id} tried to cancel job ${cancelJob.payload.jobid} but it wasn't running.`,
      };
      expect(context.emit.calledWithExactly('done', jobHandler.name, response)).to.be.equal(true);
    });
  });

  context('when jobHandlerHelper runExecutor() resolves (e.g. starting succeeds)', function() {
    let jobHandler;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    let context;
    const mockExecutor = {};
    const stubResponse = { res: 'executor process() started' };
    const stubFinalResponse = { res: 'executor process() finished' };
    before(function() {
      // mock context data and emit method
      context = {
        data: job,
        emit: sinon.stub(),
      };

      jobHandler = new JobHandler({}, DEFAULTS);

      // mock jobHandlerExecutor getExecutor
      sinon.stub(jobHandler.jobHandlerHelper, 'getExecutor', function() {
        return mockExecutor;
      });

      // mock jobHandlerHelper runExecutor
      sinon.stub(jobHandler.jobHandlerHelper, 'runExecutor', function(executor, resJob, callback) {
        return new Promise((resolve) => {
          resolve(stubResponse);
          callback(null, stubFinalResponse);
        });
      });

      jobHandler.process(context);
    });

    it('should call jobHandlerHelper getExecutor', function() {
      expect(jobHandler.jobHandlerHelper.getExecutor.calledWithExactly(job));
    });

    it('should call jobHandlerHelper runExecutor', function() {
      expect(jobHandler.jobHandlerHelper.getExecutor.calledWith(mockExecutor, job));
    });

    it('should emit progress event', function() {
      expect(context.emit.calledWithExactly('progress', jobHandler.name, stubResponse)).to.be.equal(true);
    });
  });

  context('when jobHandlerHelper runExecutor() rejects (e.g. starting fails)', function() {
    let jobHandler;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    let context;
    const mockExecutor = {};
    const stubError = new Error('executor process() failed');
    before(function() {
      // mock context data and emit method
      context = {
        data: job,
        emit: sinon.stub(),
      };

      jobHandler = new JobHandler({}, DEFAULTS);

      // mock jobHandlerExecutor getExecutor
      sinon.stub(jobHandler.jobHandlerHelper, 'getExecutor', function() {
        return mockExecutor;
      });

      // mock jobHandlerHelper runExecutor
      sinon.stub(jobHandler.jobHandlerHelper, 'runExecutor', function() {
        return new Promise((resolve, reject) => {
          reject(stubError);
        });
      });

      jobHandler.process(context);
    });

    it('should call jobHandlerHelper getExecutor', function() {
      expect(jobHandler.jobHandlerHelper.getExecutor.calledWithExactly(job));
    });

    it('should call jobHandlerHelper runExecutor', function() {
      expect(jobHandler.jobHandlerHelper.getExecutor.calledWith(mockExecutor, job));
    });

    it('should emit reject event', function() {
      expect(context.emit.calledWithExactly('error', jobHandler.name, stubError)).to.be.equal(true);
    });
  });

  context('when jobHandlerHelper runExecutor() finishes successfully (e.g. executing succeeds)', function() {
    let jobHandler;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    let context;
    const mockExecutor = {};
    const stubResponse = { res: 'executor process() started' };
    const stubFinalResponse = { res: 'executor process() finished' };
    before(function() {
      // mock context data and emit method
      context = {
        data: job,
        emit: sinon.stub(),
      };

      jobHandler = new JobHandler({}, DEFAULTS);

      // mock jobHandlerExecutor getExecutor
      sinon.stub(jobHandler.jobHandlerHelper, 'getExecutor', function() {
        return mockExecutor;
      });

      // mock jobHandlerHelper runExecutor
      sinon.stub(jobHandler.jobHandlerHelper, 'runExecutor', function(executor, resJob, callback) {
        return new Promise((resolve) => {
          resolve(stubResponse);
          callback(null, stubFinalResponse);
        });
      });

      jobHandler.process(context);
    });

    it('should call jobHandlerHelper getExecutor', function() {
      expect(jobHandler.jobHandlerHelper.getExecutor.calledWithExactly(job));
    });

    it('should call jobHandlerHelper runExecutor', function() {
      expect(jobHandler.jobHandlerHelper.getExecutor.calledWith(mockExecutor, job));
    });

    it('should emit progress event', function() {
      expect(context.emit.calledWithExactly('progress', jobHandler.name, stubResponse)).to.be.equal(true);
    });

    it('should emit done event', function() {
      expect(context.emit.calledWithExactly('done', jobHandler.name, stubFinalResponse)).to.be.equal(true);
    });
  });

  context('when jobHandlerHelper runExecutor() finishes by cancelation', function() {
    let jobHandler;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    let context;
    const mockExecutor = {};
    const stubResponse = { res: 'executor process() started' };
    const stubFinalResponse = {
      cancelMode: 'manual',
      res: 'executor process() canceled',
    };
    before(function() {
      // mock context data and emit method
      context = {
        data: job,
        emit: sinon.stub(),
      };

      jobHandler = new JobHandler({}, DEFAULTS);

      // mock jobHandlerExecutor getExecutor
      sinon.stub(jobHandler.jobHandlerHelper, 'getExecutor', function() {
        return mockExecutor;
      });

      // mock jobHandlerHelper runExecutor
      sinon.stub(jobHandler.jobHandlerHelper, 'runExecutor', function(executor, resJob, callback) {
        return new Promise((resolve) => {
          resolve(stubResponse);
          callback(null, stubFinalResponse);
        });
      });

      jobHandler.process(context);
    });

    it('should call jobHandlerHelper getExecutor', function() {
      expect(jobHandler.jobHandlerHelper.getExecutor.calledWithExactly(job));
    });

    it('should call jobHandlerHelper runExecutor', function() {
      expect(jobHandler.jobHandlerHelper.getExecutor.calledWith(mockExecutor, job));
    });

    it('should emit progress event', function() {
      expect(context.emit.calledWithExactly('progress', jobHandler.name, stubResponse)).to.be.equal(true);
    });

    it('should emit canceled event', function() {
      expect(context.emit.calledWithExactly('canceled', jobHandler.name, stubFinalResponse)).to.be.equal(true);
    });
  });

  context('when jobHandlerHelper runExecutor() finishes by timeout', function() {
    let jobHandler;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    let context;
    const mockExecutor = {};
    const stubResponse = { res: 'executor process() started' };
    const stubFinalResponse = {
      cancelMode: 'executionTimeout',
      res: 'executor process() canceled',
    };
    before(function() {
      // mock context data and emit method
      context = {
        data: job,
        emit: sinon.stub(),
      };

      jobHandler = new JobHandler({}, DEFAULTS);

      // mock jobHandlerExecutor getExecutor
      sinon.stub(jobHandler.jobHandlerHelper, 'getExecutor', function() {
        return mockExecutor;
      });

      // mock jobHandlerHelper runExecutor
      sinon.stub(jobHandler.jobHandlerHelper, 'runExecutor', function(executor, resJob, callback) {
        return new Promise((resolve) => {
          resolve(stubResponse);
          callback(null, stubFinalResponse);
        });
      });

      jobHandler.process(context);
    });

    it('should call jobHandlerHelper getExecutor', function() {
      expect(jobHandler.jobHandlerHelper.getExecutor.calledWithExactly(job));
    });

    it('should call jobHandlerHelper runExecutor', function() {
      expect(jobHandler.jobHandlerHelper.getExecutor.calledWith(mockExecutor, job));
    });

    it('should emit progress event', function() {
      expect(context.emit.calledWithExactly('progress', jobHandler.name, stubResponse)).to.be.equal(true);
    });

    it('should emit timeout event', function() {
      expect(context.emit.calledWithExactly('timeout', jobHandler.name, stubFinalResponse)).to.be.equal(true);
    });
  });

  context('when jobHandlerHelper runExecutor() finishes with error (e.g. executing fails)', function() {
    let jobHandler;
    const job = _.cloneDeep(JOB);
    job.id = new ObjectID();
    let context;
    const mockExecutor = {};
    const stubResponse = { res: 'executor process() started' };
    const stubFinalError = new Error('executor process() finished with error');
    before(function() {
      // mock context data and emit method
      context = {
        data: job,
        emit: sinon.stub(),
      };

      jobHandler = new JobHandler({}, DEFAULTS);

      // mock jobHandlerExecutor getExecutor
      sinon.stub(jobHandler.jobHandlerHelper, 'getExecutor', function() {
        return mockExecutor;
      });

      // mock jobHandlerHelper runExecutor
      sinon.stub(jobHandler.jobHandlerHelper, 'runExecutor', function(executor, resJob, callback) {
        return new Promise((resolve) => {
          resolve(stubResponse);
          callback(stubFinalError);
        });
      });

      jobHandler.process(context);
    });

    it('should call jobHandlerHelper getExecutor', function() {
      expect(jobHandler.jobHandlerHelper.getExecutor.calledWithExactly(job));
    });

    it('should call jobHandlerHelper runExecutor', function() {
      expect(jobHandler.jobHandlerHelper.getExecutor.calledWith(mockExecutor, job));
    });

    it('should emit progress event', function() {
      expect(context.emit.calledWithExactly('progress', jobHandler.name, stubResponse)).to.be.equal(true);
    });

    it('should emit error event', function() {
      expect(context.emit.calledWithExactly('error', jobHandler.name, stubFinalError)).to.be.equal(true);
    });
  });
});
