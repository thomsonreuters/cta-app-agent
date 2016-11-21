'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const cp = require('child_process');
const sinon = require('sinon');
require('sinon-as-promised');

const ResultCollectorHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'resultcollectorhelper.js'));
const SystemDetails = require(nodepath.join(appRootPath,
  '/lib/utils/systemdetails/', 'index.js'));
const logger = require('cta-logger');
const DEFAULTLOGGER = logger();

describe('ResultCollector - ResultCollectorHelper - createResultScreenshot', function() {
  let helper;
  const now = Date.now();
  const result = {
    executionId: 'id',
    testSuiteId: 'tsid',
    testId: 'tid',
    status: 'failed',
    ip: SystemDetails.ip,
    hostname: SystemDetails.hostname,
    timestamp: now,
  };
  const filename = `[${result.hostname}][${result.testId}][${result.timestamp}].png`;

  const mockCementHelper = {
    constructor: {
      name: 'CementHelper',
    },
  };

  before(function() {
    sinon.stub(Date, 'now').returns(now);
    helper = new ResultCollectorHelper(mockCementHelper, DEFAULTLOGGER);
  });
  after(function() {
    Date.now.restore();
  });

  if (process.platform === 'win32') {
    context('when process.platform is win32', function() {
      const directory = `%TEMP%\\cta\\${result.executionId}`;
      const mkdirCmd = `(If Not Exist "${directory}" (mkdir "${directory}"))`;

      const fullpath = `${directory}\\${filename}`;
      const screenshotExe = nodepath.join(appRootPath,
        '/bin/screenshot-cmd.exe');
      const screenshotCmd = `${screenshotExe} -o "${fullpath}"`;
      const cmd = mkdirCmd + ' && ' + screenshotCmd;

      context('common', function() {
        before(function() {
          sinon.stub(cp, 'exec');
          helper.createResultScreenshot(result);
        });
        after(function() {
          cp.exec.restore();
        });

        it('should call childprocess exec()', function() {
          sinon.assert.calledWith(cp.exec, cmd);
        });
      });

      context('when cp.exec() yields err', function() {
        const err = new Error('mockerror');
        before(function() {
          sinon.stub(cp, 'exec').yields(err, null, null);
          sinon.spy(helper.logger, 'error');
          helper.createResultScreenshot(result);
        });
        after(function() {
          cp.exec.restore();
          helper.logger.error.restore();
        });

        it('should log error', function() {
          sinon.assert.calledWith(helper.logger.error,
            'Screenshot exec error', err);
        });
      });

      context('when cp.exec() yields stdout', function() {
        const stdout = 'stdout';
        before(function() {
          sinon.stub(cp, 'exec').yields(null, stdout, null);
          sinon.spy(helper.logger, 'debug');
          helper.createResultScreenshot(result);
        });
        after(function() {
          cp.exec.restore();
          helper.logger.debug.restore();
        });

        it('should log stdout', function() {
          sinon.assert.calledWith(helper.logger.debug,
            `Screenshot exec stdout: ${stdout}`);
        });
      });

      context('when cp.exec() yields stderr', function() {
        const stderr = 'stderr';
        before(function() {
          sinon.stub(cp, 'exec').yields(null, null, stderr);
          sinon.spy(helper.logger, 'error');
          helper.createResultScreenshot(result);
        });
        after(function() {
          cp.exec.restore();
          helper.logger.error.restore();
        });

        it('should log stdout', function() {
          sinon.assert.calledWith(helper.logger.error,
            `Screenshot exec stderr: ${stderr}`);
        });
      });
    });
  }
});
