'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const CommandLine = require(nodepath.join(appRootPath,
  '/lib/bricks/jobhandler/executor/', 'commandline'));
const logger = require('cta-logger');

let executor;
const DEFAULTS = {
  JOBTIMEOUT: 4000,
  CMDTIMEOUT: 2000,
};
const DEFAULTLOGGER = logger();
before(function() {
  executor = new CommandLine(DEFAULTS, DEFAULTLOGGER);
});

describe('JobHandler - Executor - CommandLine - constructor', function() {
  context('when incorrect \'CMDTIMEOUT\' number property in defaults', function() {
    const defaults = {
      CMDTIMEOUT: {},
    };
    it('should throw an error', function() {
      return expect(function() {
        return new CommandLine(defaults, logger);
      }).to.throw(Error);
    });
  });

  context('when all options are valid', function() {
    it('should return a new Executor CommandLine instance', function(done) {
      expect(executor).to.be.an.instanceOf(CommandLine);
      expect(executor).to.have.property('runningJobs')
        .and.to.be.an('object');
      expect(executor).to.have.property('CANCELMODE').and.to.contain({
        STAGETIMEOUT: 'stageTimeout',
      });
      expect(executor).to.have.property('DEFAULTS')
        .and.to.be.an('object');
      expect(executor.DEFAULTS).to.have.property('JOBTIMEOUT', DEFAULTS.JOBTIMEOUT);
      expect(executor.DEFAULTS).to.have.property('CMDTIMEOUT', DEFAULTS.CMDTIMEOUT);
      done();
    });
  });
});
