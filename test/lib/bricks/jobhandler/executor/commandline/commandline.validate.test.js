'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const ObjectID = require('bson').ObjectID;

const CommandLine = require(nodepath.join(appRootPath,
  '/lib/bricks/jobhandler/executor/', 'commandline'));
const logger = require('cta-logger');

const JOB = require(`./testdata/${process.platform}/job-sample-full.json`);

let executor;
const DEFAULTS = {
  JOBTIMEOUT: 4000,
  CMDTIMEOUT: 2000,
};
const DEFAULTLOGGER = logger();
before(function() {
  executor = new CommandLine(DEFAULTS, DEFAULTLOGGER);
});

describe('JobHandler - Executor - CommandLine - validate', function() {
  context('when missing/incorrect \'stages\' Stage[] property in job payload', function() {
    it('should reject with an error', function() {
      const incorrectJob = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
        },
      };
      const validatePromise = executor.validate(incorrectJob);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'stages\' Stage[] property in job payload');
    });
  });

  context('when missing/incorrect \'run\' string property in stages[0]', function() {
    it('should reject with an error', function() {
      const incorrectJob = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
          stages: [
            {
              run: { incorrect: 'run' },
            },
          ],
        },
      };
      const validatePromise = executor.validate(incorrectJob);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'run\' string property in stages[0]');
    });
  });

  context('when missing/incorrect \'stop\' string property in stages[0]', function() {
    it('should reject with an error', function() {
      const incorrectJob = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
          stages: [
            {
              run: 'somerun',
            },
          ],
        },
      };
      const validatePromise = executor.validate(incorrectJob);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'stop\' string property in stages[0]');
    });
  });

  context('when incorrect \'cwd\' string property in stages[0]', function() {
    it('should reject with an error', function() {
      const incorrectJob = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
          stages: [
            {
              run: 'somerun',
              stop: 'somestop',
              cwd: {},
            },
          ],
        },
      };
      const validatePromise = executor.validate(incorrectJob);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'incorrect \'cwd\' string property in stages[0]');
    });
  });

  context('when incorrect \'cwd\' string property in stages[0] (path does not exist)', function() {
    it('should reject with an error', function() {
      const incorrectJob = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
          stages: [
            {
              run: 'somerun',
              stop: 'somestop',
              cwd: 'someincorrectpath',
            },
          ],
        },
      };
      const validatePromise = executor.validate(incorrectJob);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'incorrect \'cwd\' string property in stages[0].');
    });
  });

  context('when incorrect \'timeout\' number property in stages[0]', function() {
    it('should reject with an error', function() {
      const incorrectJob = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
          stages: [
            {
              run: 'somerun',
              stop: 'somestop',
              timeout: { incorrect: 'timeout' },
            },
          ],
        },
      };
      const validatePromise = executor.validate(incorrectJob);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'incorrect \'timeout\' number property in stages[0]');
    });
  });

  context('when incorrect \'stopTimeout\' number property in stages[0]', function() {
    it('should reject with an error', function() {
      const incorrectJob = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
          stages: [
            {
              run: 'somerun',
              stop: 'somestop',
              stopTimeout: { incorrect: 'timeout' },
            },
          ],
        },
      };
      const validatePromise = executor.validate(incorrectJob);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'incorrect \'stopTimeout\' number property in stages[0]');
    });
  });

  context('when incorrect \'env\' EnvironmentVariable[] property in stages[0]', function() {
    it('should reject with an error', function() {
      const incorrectJob = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
          stages: [
            {
              run: 'somerun',
              stop: 'somestop',
              env: { incorrect: 'env' },
            },
          ],
        },
      };
      const validatePromise = executor.validate(incorrectJob);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'incorrect \'env\' EnvironmentVariable[] property in stages[0]');
    });
  });

  context('when missing/incorrect \'key\' String property in item of stages[0].env', function() {
    it('should reject with an error', function() {
      const incorrectJob = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
          stages: [
            {
              run: 'somerun',
              stop: 'somestop',
              env: [
                {
                  value: 'bar',
                },
              ],
            },
          ],
        },
      };
      const validatePromise = executor.validate(incorrectJob);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'key\' String property in item of stages[0].env');
    });
  });

  context('when missing/incorrect \'value\' String property in item of stages[0].env', function() {
    it('should reject with an error', function() {
      const incorrectJob = {
        id: new ObjectID(),
        nature: {
          type: 'execution',
          quality: 'commandLine',
        },
        payload: {
          timeout: 20,
          stages: [
            {
              run: 'somerun',
              stop: 'somestop',
              env: [
                {
                  key: 'foo',
                },
              ],
            },
          ],
        },
      };
      const validatePromise = executor.validate(incorrectJob);
      return expect(validatePromise).to.eventually.be.rejectedWith(Error, 'missing/incorrect \'value\' String property in item of stages[0].env');
    });
  });

  context('when CommandLine job is valid', function() {
    it('should resolve ok', function(done) {
      const validatePromise = executor.validate(JOB);
      expect(validatePromise).to.eventually.be.an('object')
        .and.to.have.property('ok', 1);
      done();
    });
  });
});
