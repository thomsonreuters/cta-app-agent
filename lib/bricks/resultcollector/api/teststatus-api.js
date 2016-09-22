'use strict';
const exec = require('child_process').exec;
const path = require('path');
const ResultCollector = require('./../resultcollector.js');
const utils = require('../utils.js');
const extend = require('util')._extend;

class TestStatusApi {

  constructor(properties, logger) {
    this.properties = properties;
    this.logger = logger;
  }

  /**
   * Submit test status
   * @param payload - See https://git.sami.int.thomsonreuters.com/compass/cta-resultcollector#submit-test-status
   * @returns {Promise.<{nature: {type: string, quality: string}, payload: {testStatus}}>} Return CTA job with 'teststatus' type and 'result' quality
   */
  collect(payload) {
    const testStatus = extend({}, payload);
    testStatus.ids = Array.from(ResultCollector.getRunningJobIds());
    testStatus.hostname = utils.hostname;
    testStatus.ip = utils.ip;
    testStatus.timestamp = new Date().getTime();
    // testStatus.duration = 100;

    const job = {
      nature: {
        type: 'teststatus',
        quality: 'result',
      },
      payload: {
        testStatus: testStatus,
      },
    };

    return Promise.resolve(job);
  }

  /**
   * Capture screen
   * @param payload - See https://git.sami.int.thomsonreuters.com/compass/cta-resultcollector#capture-screenshot
   * @returns {Promise.<{nature: {type: string, quality: string}, payload: {ids: array, screenshot: { filepath: string}>} Return CTA job with 'teststatus' type and 'result' quality. Also return screenshot file path.
   */
  capturescreen(payload) {
    if (process.platform !== 'win32') {
      return Promise.reject('Screenshot is only supported on Windows');
    }

    return this.runScreenshotCmd(payload).then(function(fullpath) {
      const ids = Array.from(ResultCollector.getRunningJobIds());
      const newPayload = extend({}, payload);
      extend(newPayload, {
        ids: ids,
        screenshot: {
          filepath: fullpath
        },
      });
      const job = {
        nature: {
          type: 'teststatus',
          quality: 'result',
        },
        payload: newPayload,
      };
      return job;
    });
  }

  /**
   * Run screenshot command by running screenshot-cmd.exe. This work only in windows
   * @param payload - screenshot name
   * @returns {Promise.<string>} Return screenshot file path if success. Retrurn error message if fail
   */
  runScreenshotCmd(payload) {
    const directory = this.getScreenshotDirectory();
    const filename = `screenshot-${utils.hostname}-${payload.name}.png`;
    const mkdirCmd = `(If Not Exist "${directory}" (mkdir "${directory}"))`;

    const fullpath = `${directory}\\${filename}`;
    const screenshotExe = `${__dirname}\\..\\tools\\screenshot-cmd.exe`;
    const screenshotCmd = `${screenshotExe} -o "${fullpath}"`;
    const cmd = mkdirCmd + ' && ' + screenshotCmd;

    return new Promise(function(resolve, reject) {
      exec(cmd, function(err, stdout, stderr) {
        if (stdout) {
          this.logger.debug(`Screenshot exec stdout: ${stdout}`);
        }
        if (stderr) {
          this.logger.error(`Screenshot exec stderr: ${stderr}`);
        }
        if (err !== null) {
          this.logger.error('Screenshot exec error', err);
          reject(err.message);
        } else {
          resolve(fullpath);
        }
      });
    });
  }

  /**
   * Get screenshot directory
   * @returns {string}
   */
  getScreenshotDirectory() {
    if (path.isAbsolute(this.properties.screenshotDirectory)) {
      return this.properties.screenshotDirectory;
    }
    return `${__dirname}\\..\\${this.properties.screenshotDirectory}`;
  }
}

module.exports = TestStatusApi;
