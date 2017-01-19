'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');
const ObjectID = require('bson').ObjectID;

const CommandLine = require(nodepath.join(appRootPath,
  '/lib/bricks/jobhandler/executor/', 'commandline'));
const logger = require('cta-logger');

const FILEEXT = process.platform === 'win32' ? 'bat' : 'sh';
const RUNSAMPLEPATH = `./testdata/${process.platform}/run-sample.${FILEEXT}`;
const JOB = require(`./testdata/${process.platform}/job-sample-full.json`);
JOB.id = new ObjectID();
const JOBSIMPLER = require(`./testdata/${process.platform}/job-sample-simple.json`);
JOBSIMPLER.id = new ObjectID();
const JOBSIMPLERERROR = require(`./testdata/${process.platform}/job-sample-simple-error.json`);
JOBSIMPLERERROR.id = new ObjectID();

let executor;
const DEFAULTS = {
  JOBTIMEOUT: 4000,
  CMDTIMEOUT: 2000,
};
const DEFAULTLOGGER = logger();
before(function() {
  executor = new CommandLine(DEFAULTS, DEFAULTLOGGER);
});

describe('JobHandler - Executor - CommandLine - _execute', function() {
  describe('step: environment variables reformat', function() {
    context('when input env Array is incorrect', function() {
      it('should reject with an error', function() {
        const envPromise = executor._formatEnv({});
        return expect(envPromise).to.eventually.be.rejected;
      });
    });

    context('when input env Array is valid', function() {
      it('should resolve an env object formatted as key-value pairs', function(done) {
        const envPromise = executor._formatEnv(JOB.payload.stages[0].env);
        envPromise.then(function(env) {
          expect(env).to.be.an('object');
          JOB.payload.stages[0].env.forEach(function(envObj) {
            expect(env).to.have.property(envObj.key, envObj.value);
          });
          done();
        }).catch(done);
      });
    });
  });

  describe('step: temp script file creation', function() {
    context('when temp script file creation fails', function() {
      before(function(done) {
        sinon
          .stub(fs, 'writeFile')
          .yields(new Error('writeFile error'));
        done();
      });

      it('should reject with an error', function() {
        const file = executor._createFile('somescript');
        return expect(file).to.eventually.be.rejected;
      });

      after(function(done) {
        fs.writeFile.restore();
        done();
      });
    });

    context('when temp script file creation succeeds', function() {
      context('when process platform is win32', function() {
        before(function() {
          this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
          Object.defineProperty(process, 'platform', {
            value: 'win32',
          });
        });

        it('should create temporary script file and resolve ok', function(done) {
          const file = executor._createFile(JOB.payload.stages[0].run);
          file.then(function(f) {
            expect(f).to.have.property('ok', 1);
            expect(f).to.have.property('path')
              .that.is.a('String');
            fs.stat(f.path, function(err, stats) {
              if (err) throw err;
              else {
                expect(stats).to.be.an.instanceOf(fs.Stats);
                done();
              }
            });
          }).catch(done);
        });

        after(function() {
          Object.defineProperty(process, 'platform', this.originalPlatform);
        });
      });

      context('when process platform is linux', function() {
        before(function() {
          this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
          Object.defineProperty(process, 'platform', {
            value: 'linux',
          });
        });

        it('should create temporary script file and resolve ok', function(done) {
          const file = executor._createFile(JOB.payload.stages[0].run);
          file.then(function(f) {
            expect(f).to.have.property('ok', 1);
            expect(f).to.have.property('path')
              .that.is.a('String');
            fs.stat(f.path, function(err, stats) {
              if (err) throw err;
              else {
                expect(stats).to.be.an.instanceOf(fs.Stats);
                done();
              }
            });
          }).catch(done);
        });

        after(function() {
          Object.defineProperty(process, 'platform', this.originalPlatform);
        });
      });
    });
  });

  describe('step: script file execution', function() {
    context('when temp script file execution fails', function() {
      before(function(done) {
        sinon
          .stub(cp, 'spawn')
          .throws(new Error('exec error'));
        done();
      });

      it('should reject with an error', function() {
        const file = executor._execFile('somepath');
        return expect(file).to.eventually.be.rejected;
      });

      after(function(done) {
        cp.spawn.restore();
        done();
      });
    });

    context('when temp script file execution succeeds', function() {
      it('should execute file and resolve ok', function(done) {
        const runSamplePath = path.join(__dirname, RUNSAMPLEPATH);
        const execPromise = executor._execFile(runSamplePath);
        execPromise.then(function(process) {
          expect(process).to.be.an.instanceOf(cp.ChildProcess);
          process.on('close', () => {
            done();
          });
        }).catch(done);
      });
    });
  });

  describe('all steps', function() {
    context('when env variable formatting fails', function() {
      before(function(done) {
        sinon
          .stub(executor, '_formatEnv')
          .rejects(new Error('format environment error'));
        done();
      });

      it('should reject with an error', function() {
        const executePromise = executor.process(JOB);
        return expect(executePromise).to.eventually.be.rejectedWith(Error, 'format environment error');
      });

      after(function(done) {
        executor._formatEnv.restore();
        done();
      });
    });

    context('when temp script file creation fails', function() {
      before(function(done) {
        sinon
          .stub(fs, 'writeFile')
          .yields(new Error('writeFile error'));
        done();
      });

      it('should reject with an error', function() {
        const executePromise = executor.process(JOB);
        return expect(executePromise).to.eventually.be.rejected;
      });

      after(function(done) {
        fs.writeFile.restore();
        done();
      });
    });

    context('when temp script file execution fails', function() {
      before(function(done) {
        sinon
          .stub(cp, 'spawn')
          .throws(new Error('exec error'));
        done();
      });

      it('should reject with an error', function(done) {
        const executePromise = executor.process(JOB, (error, response) => {
          expect(error).to.be.an.instanceOf(Error, 'exec error');
          expect(response).to.have.property('states', 'finished');
          expect(response).to.have.property('ok', 0);
          expect(response).to.have.property('message')
            .and.to.include(`Execute RUN CmdLine Job ${JOB.id}: finished with error`);
          expect(executor.runningJobs).to.not.have.property(JOB.id);
          done();
        });
        expect(executePromise).to.eventually.be.rejectedWith('exec Error');
      });

      after(function(done) {
        cp.spawn.restore();
        done();
      });
    });

    context('when all steps pass', function() {
      context('job with only required properties', function() {
        context('job with a failing script', function() {
          it('should execute job and fulfill response; when process done, exitcode should not be 0', function(done) {
            // without process exit callback
            const executePromise = executor.process(JOBSIMPLERERROR, (error, response) => {
              expect(error).to.be.a('null');
              expect(response).to.have.property('states', 'finished');
              expect(response).to.have.property('ok', 1);
              expect(response).to.have.property('message')
                .and.to.include(`Execute RUN CmdLine Job ${JOBSIMPLERERROR.id}: finished with error`);
              expect(response).to.have.property('process')
                .and.to.be.an.instanceOf(cp.ChildProcess);
              expect(response).to.have.property('code', 1);
              expect(executor.runningJobs).to.not.have.property(JOBSIMPLERERROR.id);
              done();
            });
            executePromise.then(function(response) {
              expect(response).to.be.an('object');
              expect(response).to.have.property('ok', 1);
              expect(response).to.have.property('message', `Execute RUN CmdLine Job ${JOBSIMPLERERROR.id}: STARTED`);
              expect(executor.runningJobs).to.have.property(JOBSIMPLERERROR.id);
            }).catch(done);
          });
        });

        context('job with a succeeding script', function() {
          it('should execute job and fulfill response; when process done, exitcode should be 0', function(done) {
            // with process exit callback
            const executePromise = executor.process(JOBSIMPLER, (error, response) => {
              expect(error).to.be.a('null');
              expect(response).to.have.property('states', 'finished');
              expect(response).to.have.property('ok', 1);
              expect(response).to.have.property('message', `Execute RUN CmdLine Job ${JOBSIMPLER.id}: finished`);
              expect(response).to.have.property('process')
                .and.to.be.an.instanceOf(cp.ChildProcess);
              expect(response).to.have.property('code', 0);
              expect(executor.runningJobs).to.not.have.property(JOBSIMPLER.id);
              done();
            });
            executePromise.then(function(response) {
              expect(response).to.be.an('object');
              expect(response).to.have.property('ok', 1);
              expect(response).to.have.property('message', `Execute RUN CmdLine Job ${JOBSIMPLER.id}: STARTED`);
              expect(executor.runningJobs).to.have.property(JOBSIMPLER.id);
            }).catch(done);
          });
        });
      });

      context('job with all properties', function() {
        it('should execute job and fulfill response', function(done) {
          const executePromise = executor.process(JOB, (error, response) => {
            expect(error).to.be.a('null');
            expect(response).to.have.property('states', 'finished');
            expect(response).to.have.property('ok', 1);
            expect(response).to.have.property('message', `Execute RUN CmdLine Job ${JOB.id}: finished`);
            expect(response).to.have.property('process')
              .and.to.be.an.instanceOf(cp.ChildProcess);
            expect(response).to.have.property('code', 0);
            expect(executor.runningJobs).to.not.have.property(JOB.id);
            done();
          });
          executePromise.then(function(response) {
            expect(response).to.be.an('object');
            expect(response).to.have.property('ok', 1);
            expect(response).to.have.property('message', `Execute RUN CmdLine Job ${JOB.id}: STARTED`);
            expect(executor.runningJobs).to.have.property(JOB.id);
          }).catch(done);
        });
      });
    });
  });
});
