'use strict';
const appRootPath = require('app-root-path').path;
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
      const priorityA = jobA.hasOwnProperty('priority') ? jobA.payload.priority : self.DEFAULTS.priority;
      const priorityB = jobB.hasOwnProperty('priority') ? jobB.payload.priority : self.DEFAULTS.priority;
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
    id: new ObjectID(),
    nature: {
      type: 'execution',
      quality: 'commandLine',
    },
    payload: {
      priority: 2,
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
      expect(jobQueue.has(jobA.id)).to.equal(true);
    });
  });

  context('don\'t have', function() {
    it('should return false', function() {
      expect(jobQueue.has(jobA.id)).to.equal(false);
    });
  });
});

describe('Job Queue - isEmpty check', function() {
  const jobA = {
    id: new ObjectID(),
    nature: {
      type: 'execution',
      quality: 'commandLine',
    },
    payload: {
      priority: 2,
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
    id: new ObjectID(),
    nature: {
      type: 'execution',
      quality: 'commandLine',
    },
    payload: {
      priority: 2,
    },
  };

  afterEach(function() {
    jobQueue.clear();
  });

  context('job has no id', function() {
    it('should throw error', function() {
      return expect(function() {
        return jobQueue.queue({
          nature: {},
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
      }).to.throw(Error, `A job with id ${jobA.id} is already present in queue.`);
    });
  });

  context('no job with same id', function() {
    it('should enqueue job', function() {
      jobQueue.queue(jobA);
      expect(jobQueue.has(jobA.id)).to.equal(true);
    });
  });
});

describe('Job Queue - remove specific job', function() {
  const id = new ObjectID();
  const jobA = {
    id: id,
    nature: {
      type: 'execution',
      quality: 'commandLine',
    },
    payload: {
      priority: 2,
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
