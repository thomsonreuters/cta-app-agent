'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const ObjectID = require('bson').ObjectID;

const JobQueue = require(nodepath.join(appRootPath,
  '/lib/bricks/jobbroker/', 'jobqueue.js'));

const jobQueue = new JobQueue(
  {
    comparator: function comparator(jobA, jobB) {
      const that = this;
      const priorityA = jobA.payload.execution.hasOwnProperty('priority')
        ? jobA.payload.execution.priority : that.DEFAULTS.priority;
      const priorityB = jobB.payload.execution.hasOwnProperty('priority')
        ? jobB.payload.execution.priority : that.DEFAULTS.priority;
      if (priorityA === priorityB) return -1;
      return priorityA - priorityB;
    },
    strategy: JobQueue.ArrayStrategy,
  }
);

before(function() {
  jobQueue.clear();
});

describe('Job Queue - has specific job', function() {
  const jobA = {
    nature: {
      type: 'execution',
      quality: 'run',
    },
    payload: {
      execution: {
        id: (new ObjectID()).toString(),
        priority: 2,
      },
    },
  };

  afterEach(function() {
    jobQueue.clear();
  });

  context('do have', function() {
    before(function() {
      jobQueue.queue(jobA);
    });

    it('should return true', function() {
      expect(jobQueue.has(jobA.payload.execution.id)).to.equal(true);
    });
  });

  context('don\'t have', function() {
    it('should return false', function() {
      expect(jobQueue.has(jobA.payload.execution.id)).to.equal(false);
    });
  });
});

describe('Job Queue - isEmpty check', function() {
  const jobA = {
    nature: {
      type: 'execution',
      quality: 'run',
    },
    payload: {
      execution: {
        id: (new ObjectID()).toString(),
        priority: 2,
      },
    },
  };

  afterEach(function() {
    jobQueue.clear();
  });

  context('empty', function() {
    before(function() {
      jobQueue.queue(jobA);
    });

    it('should return true', function() {
      expect(jobQueue.isEmpty()).to.equal(true);
    });
  });

  context('don\'t have', function() {
    it('should return false', function() {
      expect(jobQueue.isEmpty()).to.equal(false);
    });
  });
});

describe('Job Queue - enqueue a job', function() {
  const jobA = {
    nature: {
      type: 'execution',
      quality: 'run',
    },
    payload: {
      execution: {
        id: (new ObjectID()).toString(),
        priority: 2,
      },
    },
  };

  afterEach(function() {
    jobQueue.clear();
  });

  context('job has no id', function() {
    it('should throw error', function() {
      return expect(function() {
        return jobQueue.queue({
          nature: {
            type: 'execution',
            quality: 'run',
          },
          payload: {
            execution: {},
          },
        });
      }).to.throw(Error, 'missing/incorrect \'id\' ObjectID property in job');
    });
  });

  context('job with same id already exists', function() {
    before(function() {
      jobQueue.queue(jobA);
    });

    it('should throw error', function() {
      return expect(function() {
        return jobQueue.queue(jobA);
      }).to.throw(Error, `A job with id ${jobA.payload.execution.id} is already present in queue.`);
    });
  });

  context('no job with same id', function() {
    it('should enqueue job', function() {
      jobQueue.queue(jobA);
      expect(jobQueue.has(jobA.payload.execution.id)).to.equal(true);
    });
  });
});

describe('Job Queue - remove specific job', function() {
  const id = (new ObjectID()).toString();
  const jobA = {
    nature: {
      type: 'execution',
      quality: 'run',
    },
    payload: {
      execution: {
        id: id,
        priority: 2,
      },
    },
  };

  afterEach(function() {
    jobQueue.clear();
  });

  context('do have', function() {
    before(function() {
      jobQueue.queue(jobA);
    });

    it('should remove job and return it', function() {
      expect(jobQueue.remove(id)).to.deep.equal(jobA);
      expect(jobQueue.has(id)).to.equal(false);
    });
  });

  context('don\'t have', function() {
    it('should return false', function() {
      expect(jobQueue.remove('A')).to.equal(undefined);
    });
  });
});
