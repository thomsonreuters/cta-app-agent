'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');

const ObjectID = require('bson').ObjectID;

const JobBroker = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'index.js'));
const JobBrokerHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobbrokerhelper.js'));
const JobQueue = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobqueue.js'));

const DEFAULTS = {
  name: 'jobbroker',
  module: 'cta-jobbroker',
  properties: {
    priority: 100,
  },
};

describe('Job Broker - module loading', function() {
  let jobBroker;
  const mockCementHelper = {
    constructor: {
      name: 'CementHelper',
    },
    brickName: 'jobbroker',
  };
  before(function() {
    jobBroker = new JobBroker(mockCementHelper, DEFAULTS);
  });
  it('should return new jobHandler object', function(done) {
    expect(jobBroker).to.be.an.instanceof(JobBroker);
    expect(jobBroker).to.have.property('queue')
      .and.to.be.an.instanceof(JobQueue);
    expect(jobBroker).to.have.property('runningJobs');
    expect(jobBroker.runningJobs).to.have.property('run')
      .and.to.be.an.instanceof(Map);
    expect(jobBroker.runningJobs).to.have.property('read')
      .and.to.be.an.instanceof(Map);
    expect(jobBroker.runningJobs).to.have.property('cancel')
      .and.to.be.an.instanceof(Map);
    expect(jobBroker.DEFAULTS.priority).to.equal(DEFAULTS.properties.priority);
    expect(jobBroker).to.have.property('jobBrokerHelper')
      .and.to.be.an.instanceof(JobBrokerHelper);
    done();
  });
});

describe.skip('Job Broker - job validation', function() {
  let jobBroker;
  const mockCementHelper = {
    constructor: {
      name: 'CementHelper',
    },
    brickName: 'jobbroker',
  };
  before(function() {
    jobBroker = new JobBroker(mockCementHelper, DEFAULTS);
    sinon.stub(jobBroker.jobBrokerHelper, 'send');
    sinon.stub(jobBroker.jobBrokerHelper, 'ack');
  });
  after(function() {
    jobBroker.jobBrokerHelper.send.restore();
    jobBroker.jobBrokerHelper.ack.restore();
  });
  context('when missing/incorrect \'id\' ObjectID property in job', function() {
    it('should throw an error', function() {
      const job = {
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
        },
      };
      const context = { data: job };
      const validatePromise = jobBroker.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'id\' ObjectID property in job');
    });
  });

  context('when incorrect \'priority\' number property in job payload', function() {
    it('should throw an error', function() {
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
          priority: {},
        },
      };
      const context = { data: job };
      const validatePromise = jobBroker.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'incorrect \'priority\' number property in job payload');
    });
  });

  context('when incorrect \'groupjobid\' ObjectID property in job payload', function() {
    it('should throw an error', function() {
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
          groupjobid: {},
        },
      };
      const context = { data: job };
      const validatePromise = jobBroker.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'incorrect \'groupjobid\' ObjectID property in job payload');
    });
  });

  context('when missing/incorrect \'jobid\' ObjectID property in Cancelation job.payload', function() {
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
      const context = { data: job };
      const validatePromise = jobBroker.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'jobid\' ObjectID property in Cancelation job.payload');
    });
  });

  context('when missing/incorrect \'queue\' string property in group job.payload', function() {
    it('should throw an error', function() {
      const job = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'group',
        },
        payload: {
          queue: {},
        },
      };
      const context = { data: job };
      const validatePromise = jobBroker.validate(context);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'queue\' string property in group job.payload');
    });
  });

  context('when rejecting', function() {
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
    const context = { data: job };
    it('should send ack job and create job', function(done) {
      jobBroker.validate(context).catch((err) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(jobBroker.jobBrokerHelper.ack.calledWithExactly(job)).to.be.equal(true);
        expect(jobBroker.jobBrokerHelper.send.calledWithExactly({
          nature: {
            type: 'state',
            quality: 'create',
          },
          payload: {
            jobid: job.id,
            state: 'finished',
            error: err,
            message: err.message,
          },
        })).to.be.equal(true);
        done();
      });
    });
  });
});

describe('Job Broker - priority queue comparator', function() {
  let jobBroker;
  const mockCementHelper = {
    constructor: {
      name: 'CementHelper',
    },
    brickName: 'jobbroker',
  };
  const defaultPriority = DEFAULTS.properties.priority;
  const createNewJob = function(priority) {
    const job = {
      nature: {
        type: 'execution',
        quality: 'run',
      },
      payload: {
        execution: {
          id: (new ObjectID()).toString(),
        },
      },
    };
    if (priority) {
      job.payload.execution.priority = priority;
    }
    return job;
  };
  const jobA = createNewJob(defaultPriority);
  const jobB = createNewJob();
  const jobC = createNewJob(defaultPriority - 1);
  const jobD = createNewJob(defaultPriority + 1);
  const jobE = createNewJob(defaultPriority);

  before(function() {
    jobBroker = new JobBroker(mockCementHelper, DEFAULTS);
    jobBroker.queue.queue(jobA);
    jobBroker.queue.queue(jobB);
    jobBroker.queue.queue(jobC);
    jobBroker.queue.queue(jobD);
    jobBroker.queue.queue(jobE);
  });

  after(function() {
    jobBroker.queue.clear();
  });

  it('should dequeue by job.payload.priority ascending order + fifo', function() {
    expect(jobBroker.queue.dequeue()).to.equal(jobC);
    expect(jobBroker.queue.dequeue()).to.equal(jobA);
    expect(jobBroker.queue.dequeue()).to.equal(jobB);
    expect(jobBroker.queue.dequeue()).to.equal(jobE);
    expect(jobBroker.queue.dequeue()).to.equal(jobD);
  });
});
