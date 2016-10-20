'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const cp = require('child_process');

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

const JOBSIMPLERSTUCKMANUAL = require(`./testdata/${process.platform}/job-sample-simple-stuck-manual.json`);
JOBSIMPLERSTUCKMANUAL.id = (new ObjectID()).toString();
const JOBSIMPLERSTUCKJOB = require(`./testdata/${process.platform}/job-sample-simple-stuck-jobtimeout.json`);
JOBSIMPLERSTUCKJOB.id = (new ObjectID()).toString();
const JOBSIMPLERSTUCKSTAGE = require(`./testdata/${process.platform}/job-sample-simple-stuck-stagetimeout.json`);
JOBSIMPLERSTUCKSTAGE.id = (new ObjectID()).toString();
const JOBSIMPLERSTUCKSTOP = require(`./testdata/${process.platform}/job-sample-simple-stuck-stoptimeout.json`);
JOBSIMPLERSTUCKSTOP.id = (new ObjectID()).toString();

let executor;
const DEFAULTS = {
  JOBTIMEOUT: 4000,
  CMDTIMEOUT: 2000,
};
const DEFAULTLOGGER = logger();
before(function() {
  executor = new CommandLine(DEFAULTS, DEFAULTLOGGER);
});

describe('JobHandler - Executor - CommandLine - _cancel', function() {
  describe('manual cancelation', function() {
    context('when job is currently running', function() {
      context.skip('when sending SIGKILL fails', function() {
        before(function(done) {
          sinon
            .stub(executor, '_kill').yields(new Error('kill error'));
          done();
        });

        it('should execute stop script, fulfill response with error', function(done) {
          executor.process(JOBSIMPLERSTUCKMANUAL, (error, response) => {
            expect(error).to.be.a('null');
            expect(response).to.have.property('state', 'canceled');
            expect(response).to.have.property('ok', 1);
            expect(response).to.have.property('message')
              .and.to.include(`Execute RUN CmdLine Job ${JOBSIMPLERSTUCKMANUAL.id}: canceled`);
            expect(response).to.have.property('process')
              .and.to.be.an.instanceOf(cp.ChildProcess);
            expect(response).to.have.property('code');
          }).then(() => {
            // wait 1s before trying to kill
            setTimeout(() => {
              const CANCELJOB = {
                id: (new ObjectID()).toString(),
                nature: {
                  type: 'execution',
                  quality: 'cancel',
                },
                payload: {
                  jobid: JOBSIMPLERSTUCKMANUAL.id,
                },
              };
              executor.process(CANCELJOB, () => {
                expect(executor.runningJobs).to.not.have.property(JOBSIMPLERSTUCKMANUAL.id);
                done();
              }).then((cancelResponse) => {
                expect(cancelResponse).to.be.an('object');
                expect(cancelResponse).to.have.property('error');
              });
            }, 1000);
          }).catch(done);
        });

        after(function(done) {
          executor._kill.restore();
          done();
        });
      });

      context('when sending SIGKILL succeeds', function() {
        it('should kill process, execute stop script, fulfill response', function(done) {
          executor.process(JOBSIMPLERSTUCKMANUAL, (error, response) => {
            expect(error).to.be.a('null');
            expect(response).to.have.property('state', 'canceled');
            expect(response).to.have.property('cancelMode', executor.CANCELMODE.MANUAL);
            expect(response).to.have.property('ok', 1);
            expect(response).to.have.property('message')
              .and.to.include(`Execute RUN CmdLine Job ${JOBSIMPLERSTUCKMANUAL.id}: canceled`);
            expect(response).to.have.property('process')
              .and.to.be.an.instanceOf(cp.ChildProcess);
            expect(response).to.have.property('code');
          }).then(() => {
            // wait 1s before trying to kill
            setTimeout(() => {
              const CANCELJOB = {
                id: (new ObjectID()).toString(),
                nature: {
                  type: 'execution',
                  quality: 'cancel',
                },
                payload: {
                  jobid: JOBSIMPLERSTUCKMANUAL.id,
                },
              };
              executor.process(CANCELJOB, () => {
                expect(executor.runningJobs).to.not.have.property(JOBSIMPLERSTUCKMANUAL.id);
                done();
              }).then((cancelResponse) => {
                expect(cancelResponse).to.be.an('object');
              });
            }, 1000);
          }).catch(done);
        });
      });
    });

    context('when job is not running', function() {
      it('should fulfill response with message \'No job running\'', function(done) {
        executor._cancel(JOBSIMPLERSTUCKMANUAL.id).then((cancelResponse) => {
          expect(cancelResponse).to.be.an('object');
          expect(cancelResponse).to.have.property('ok', 1);
          expect(cancelResponse).to.have.property('message',
            `Cancel CmdLine Job ${JOBSIMPLERSTUCKMANUAL.id}: finished (No job running with id ${JOBSIMPLERSTUCKMANUAL.id})`);
          done();
        }).catch(done);
      });
    });
  });

  describe('timeout cancelation', function() {
    context('when expiring the stage timeout', function() {
      it('should cancel job after expiring the timeout', function(done) {
        executor.process(JOBSIMPLERSTUCKSTAGE, (error, response) => {
          expect(error).to.be.a('null');
          expect(response).to.have.property('state', 'canceled');
          expect(response).to.have.property('cancelMode', executor.CANCELMODE.STAGETIMEOUT);
          expect(response).to.have.property('ok', 1);
          expect(response).to.have.property('message')
            .and.to.include(`Execute RUN CmdLine Job ${JOBSIMPLERSTUCKSTAGE.id}: canceled`);
          expect(response).to.have.property('process')
            .and.to.be.an.instanceOf(cp.ChildProcess);
          expect(response).to.have.property('code');
        }).then(() => {
          // wait 1s after the stage timeout before testing
          const stageTimeout = (JOBSIMPLERSTUCKSTAGE.payload.stages[0].timeout
            || executor.DEFAULTS.CMDTIMEOUT) + 1000;
          setTimeout(() => {
            expect(executor.runningJobs).to.not.have.property(JOBSIMPLERSTUCKSTAGE.id);
            done();
          }, stageTimeout);
        }).catch(done);
      });
    });

    context('when expiring the stop timeout (cancelation is stuck)', function() {
      it('should cancel job after expiring 2*stageTimeout', function(done) {
        executor.process(JOBSIMPLERSTUCKSTOP, (error, response) => {
          expect(error).to.be.a('null');
          expect(response).to.have.property('state', 'canceled');
          expect(response).to.have.property('ok', 1);
          expect(response).to.have.property('message')
            .and.to.include(`Execute RUN CmdLine Job ${JOBSIMPLERSTUCKSTOP.id}: canceled`);
          expect(response).to.have.property('process')
            .and.to.be.an.instanceOf(cp.ChildProcess);
          expect(response).to.have.property('code');
        }).then(() => {
          // wait 1s after the stage+stop timeout before testing
          const stopTimeout = ((JOBSIMPLERSTUCKSTOP.payload.stages[0].stopTimeout
            || JOBSIMPLERSTUCKSTOP.payload.stages[0].timeout
            || (executor.DEFAULTS.CMDTIMEOUT))
            * 2) + 1000;
          setTimeout(() => {
            expect(executor.runningJobs).to.not.have.property(JOBSIMPLERSTUCKSTOP.id);
            done();
          }, stopTimeout);
        }).catch(done);
      });
    });
  });
});
