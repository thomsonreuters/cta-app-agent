/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

/**
 * Created by U6020429 on 08/01/2016.
 */

'use strict';

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const co = require('co');
const promisify = require('es6-promisify');
const kill = require('tree-kill');

const Executor = require('./executor');

/**
 * Executor CommandLine class
 * @class
 * @extends Executor
 * @property {Object} runningJobs - A Map of all the Jobs being run by this Executor instance
 * @property {Object} DEFAULTS - Defaults options
 * @property {Number} DEFAULTS.JOBTIMEOUT - The default timeout used to cancel Job after expiration
 * @property {Number} DEFAULTS.CMDTIMEOUT - The default timeout used to cancel
 * a Command/Stage of a Job after expiration
 */
class CommandLine extends Executor {
  /**
   * Creates a new Job CommandLine Executor instance
   * @param {Object} defaults - default properties for the executor
   * @param {Number} defaults.JOBTIMEOUT - default job timeout
   * @param {Number} defaults.CMDTIMEOUT - default command timeout
   * @param {Object} logger - logger instance
   */
  constructor(defaults, logger) {
    super(defaults, logger);
    this.CANCELMODE.STAGETIMEOUT = 'stageTimeout';
    this.DEFAULTS.CMDTIMEOUT = 2000;
    if (defaults) {
      if (defaults.hasOwnProperty('CMDTIMEOUT')) {
        if (typeof defaults.CMDTIMEOUT === 'number') {
          this.DEFAULTS.CMDTIMEOUT = defaults.CMDTIMEOUT;
        } else {
          throw new Error('incorrect \'CMDTIMEOUT\' number property');
        }
      }
    }
  }

  /**
   * Validates Job properties specific to CommandLine Executor
   * @param {CommandLineJob} job - input job
   * @returns {Promise<Object>} - { ok: 0|1 }
   */
  validate(job) {
    return new Promise((resolve, reject) => {
      const superValidate = super.validate;
      const promisifiedStat = promisify(fs.stat);
      co(function* validateCoroutine() {
        yield superValidate(job);

        if (!job.payload.hasOwnProperty('stages') || !(Array.isArray(job.payload.stages))) {
          throw (new Error('missing/incorrect \'stages\' Stage[] property in job payload'));
        }

        for (let index = 0; index < job.payload.stages.length; index += 1) {
          const stage = job.payload.stages[index];
          if (!('run' in stage) || typeof stage.run !== 'string') {
            throw (new Error(`missing/incorrect 'run' string property in stages[${index}]`));
          }

          if (!('stop' in stage) || typeof stage.stop !== 'string') {
            throw (new Error(`missing/incorrect 'stop' string property in stages[${index}]`));
          }

          if (stage.hasOwnProperty('cwd')) {
            if (typeof stage.cwd !== 'string') {
              throw (new Error(`incorrect 'cwd' string property in stages[${index}]. Error: Not a String.`));
            } else {
              try {
                yield promisifiedStat(stage.cwd);
              } catch (err) {
                throw (new Error(`incorrect 'cwd' string property in stages[${index}]. ${err}`));
              }
            }
          }

          if (('timeout' in stage) && typeof stage.timeout !== 'number') {
            throw (new Error(`incorrect 'timeout' number property in stages[${index}]`));
          }

          if (('stopTimeout' in stage) && typeof stage.stopStimeout !== 'number') {
            throw (new Error(`incorrect 'stopTimeout' number property in stages[${index}]`));
          }

          if ('env' in stage) {
            if (!(Array.isArray(stage.env))) {
              throw (new Error(`incorrect 'env' EnvironmentVariable[] property in stages[${index}]`));
            } else {
              for (let envIndex = 0; envIndex < stage.env.length; envIndex += 1) {
                const e = stage.env[envIndex];
                if (!e.hasOwnProperty('key') || typeof e.key !== 'string') {
                  throw (new Error(`missing/incorrect 'key' String property in item of stages[${index}].env`));
                }
                if (!e.hasOwnProperty('value') || typeof e.value !== 'string') {
                  throw (new Error(`missing/incorrect 'value' String property in item of stages[${index}].env`));
                }
              }
            }
          }
        }
        return { ok: 1 };
      }).then(resolve).catch(reject);
    });
  }

  /**
   * Creates a temporary file with provided content
   * @param {String} content - the content of the file
   * @returns {Promise<_createFileResponse>}
   * @private
   */
  _createFile(content) {
    return new Promise((resolve, reject) => {
      const tmpDir = global.tmpDir || os.tmpdir();
      let fileExtension;
      let finalContent;
      let options;
      switch (process.platform) {
        case 'win32':
          fileExtension = '.bat';
          finalContent = `@echo off ${os.EOL} rem cmd ${os.EOL}`;
          finalContent += content;
          options = {};
          break;
        default:
          fileExtension = '.sh';
          finalContent = '#!/bin/bash';
          finalContent += os.EOL;
          finalContent += content;
          options = {
            mode: 0o0755,
          };
          break;
      }
      const filepath = path.join(tmpDir,
        new Date().getTime() + Math.random().toString(36).slice(2) + fileExtension);
      fs.writeFile(filepath, finalContent, options, function writeFileCallback(err) {
        if (err) reject(err);
        else {
          resolve({
            ok: 1,
            path: filepath,
          });
        }
      });
    });
  }

  /**
   * Executes a file with ChildProcess.spawn()
   * @param {String} filepath - the path to the file to execute
   * @param {Object} [env] - key-value pairs of environment variables
   * @param {String} [cwd] - the working directory where to execute
   * @returns {Promise<ChildProcess>}
   * @private
   */
  _execFile(filepath, env, cwd) {
    return new Promise((resolve, reject) => {
      const options = {};
      if (env) options.env = env;
      if (cwd) options.cwd = cwd;
      let command;
      let commandParams;
      switch (process.platform) {
        case 'win32':
          command = 'cmd';
          commandParams = ['/c', filepath];
          break;
        default:
          command = 'sh';
          commandParams = [filepath];
          break;
      }

      try {
        const spawn = cp.spawn(command, commandParams, options);

        this.logger.info(`Process ${spawn.pid} started`);

        spawn.stdout.setEncoding('utf8');
        spawn.stdout.on('data', (data) => {
          this.logger.verbose(data);
        });

        spawn.stderr.setEncoding('utf8');
        spawn.stderr.on('data', (data) => {
          this.logger.error(`stderr: ${data}`);
        });

        spawn.on('close', (code) => {
          this.logger.info(`Process ${spawn.pid} exited with code ${code}`);
        });

        resolve(spawn);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Returns a formatted env object (key-value pairs) from an EnvironmentVariable Array
   * @param {EnvironmentVariable[]} envObjArray - Array of EnvironmentVariable objects
   * @returns {Promise<Object>} - Env variables formatted as Key-Value pairs object
   * @private
   */
  _formatEnv(envObjArray) {
    return new Promise((resolve, reject) => {
      const env = {};
      try {
        envObjArray.forEach((envObj) => {
          env[envObj.key] = envObj.value;
        });
        resolve(env);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Kills a process
   * @param {Number} pid - id of the process to kill
   * @param {String} signal - signal to send to the process (SIGTERM|SIGKILL)
   * @param {Function} callback - callback(error)
   * @todo Rewrite tree-kill module
   * @private
   */
  _kill(pid, signal, callback) {
    kill(pid, signal, callback);
  }

  /**
   * Executes a Stage: creates a temporary script file
   * from the stage run content, executes the file, calls the provided
   * callback when execution finishes.
   * @override
   * @summary Executes a Stage
   * @param {String} jobid - id of the job
   * @param {Number} stageidx - Array index of the stage to execute
   * @param {Boolean} stop - if true, executes the stop script instead of run and stops the job
   * @param {Function} callback - function called when execution of stage finishes
   * @returns {Promise<ChildProcess>}
   * @private
   */
  _executeStage(jobid, stageidx, stop, callback) {
    this.logger.info(`Execute ${stop ? 'STOP' : 'RUN'} CmdLine Stage #${stageidx}: STARTED`);
    const that = this;
    return co(function* executeStage() {
      const stage = that.runningJobs[jobid].job.payload.stages[stageidx];
      const env = stage.hasOwnProperty('env') ? yield that._formatEnv(stage.env) : null;
      const cwd = stage.hasOwnProperty('cwd') ? stage.cwd : null;
      const file = yield that._createFile(stop ? stage.stop : stage.run);
      const process = yield that._execFile(file.path, env, cwd);
      if (!stop) {
        that.runningJobs[jobid].process = process;
        that.runningJobs[jobid].stage = stage;
        that.runningJobs[jobid].stageidx = stageidx;
        that.runningJobs[jobid].stageTimeout = setTimeout(() => {
          if (that.runningJobs.hasOwnProperty(jobid) && !that.runningJobs[jobid].canceled) {
            that.logger.warn(`Stage Timeout exceeded for CmdLine Job ${jobid} - Stage #${stageidx}`);
            that._cancel(jobid, that.CANCELMODE.STAGETIMEOUT);
          }
        }, stage.timeout || that.DEFAULTS.CMDTIMEOUT);
      }
      if (stop) {
        that.runningJobs[jobid].stopTimeout = setTimeout(() => {
          that.logger.warn(`Stop Timeout exceeded for CmdLine Job ${jobid} - Stage #${stageidx}`);
          kill(process.pid, 'SIGKILL');
        }, stage.stopTimeout || stage.timeout || that.DEFAULTS.CMDTIMEOUT);
      }
      process.on('close', function onProcessClosed(code) {
        that.logger.info(`Execute ${stop ? 'STOP' : 'RUN'} CmdLine Stage #${stageidx}: finished (exitcode: ${code})`);
        if (that.runningJobs.hasOwnProperty(jobid)) {
          if (that.runningJobs[jobid].stageTimeout) {
            clearTimeout(that.runningJobs[jobid].stageTimeout);
          }
          if (stop) {
            clearTimeout(that.runningJobs[jobid].stopTimeout);
          }
        }
        if (callback && typeof callback === 'function') {
          callback(process, code);
        }
      });
      return process;
    });
  }

  /**
   * @override
   */
  _execute(job, callback) {
    this.logger.info(`Execute RUN CmdLine Job ${job.id}: STARTED`);
    return new Promise((resolve, reject) => {
      const that = this;
      co(function* execute() {
        let stageidx = 0;
        // recursive function
        function onStageFinished(process, code) {
          if (!that.runningJobs.hasOwnProperty(job.id) || that.runningJobs[job.id].canceled) {
            that.logger.info(`Execute RUN CmdLine Job ${job.id}: canceled (${that.runningJobs[job.id].canceledMode}) during Stage #${stageidx}`);
            if (callback && typeof callback === 'function') {
              callback(null, {
                ok: 1,
                state: that.STATES.canceled,
                cancelMode: that.runningJobs[job.id].canceledMode,
                message: `Execute RUN CmdLine Job ${job.id}: canceled (${that.runningJobs[job.id].canceledMode}) during Stage #${stageidx}`,
                process: process,
                code: code,
              });
            }
            delete that.runningJobs[job.id];
          } else if (code !== 0) {
            delete that.runningJobs[job.id];
            that.logger.info(`Execute RUN CmdLine Job ${job.id}: finished ` +
              `with error at Stage #${stageidx} (exitcode: ${code})`);
            if (callback && typeof callback === 'function') {
              callback(null, {
                ok: 1,
                state: that.STATES.finished,
                message: `Execute RUN CmdLine Job ${job.id}: finished ` +
                `with error at Stage #${stageidx} (exitcode: ${code})`,
                process: process,
                code: code,
              });
            }
          } else if (stageidx >= job.payload.stages.length - 1) {
            delete that.runningJobs[job.id];
            that.logger.info(`Execute RUN CmdLine Job ${job.id}: finished`);
            if (callback && typeof callback === 'function') {
              callback(null, {
                ok: 1,
                state: that.STATES.finished,
                message: `Execute RUN CmdLine Job ${job.id}: finished`,
                process: process,
                code: code,
              });
            }
          } else {
            clearTimeout(that.runningJobs[job.id].stageTimeout);
            stageidx += 1;
            that._executeStage(job.id, stageidx, false, onStageFinished);
          }
        }

        const process = yield that._executeStage(job.id, stageidx, false, onStageFinished);
        return {
          ok: 1,
          state: that.STATES.running,
          message: `Execute RUN CmdLine Job ${job.id}: STARTED`,
          process: process,
        };
      }).then(resolve).catch((error) => {
        reject(error);
        if (that.runningJobs.hasOwnProperty(job.id)) {
          delete that.runningJobs[job.id];
        }
        if (callback && typeof callback === 'function') {
          callback(error, {
            ok: 0,
            state: that.STATES.finished,
            message: `Execute RUN CmdLine Job ${job.id}: finished with error`,
            error: error,
          });
        }
      });
    });
  }

  /**
   * @override
   */
  _cancel(jobid, mode, callback) {
    this.logger.info(`Cancel CmdLine Job ${jobid}: STARTED`);
    const that = this;
    return new Promise((resolve, reject) => {
      const response = {
        ok: 1,
      };
      if (!this.runningJobs.hasOwnProperty(jobid)) {
        response.message = `Cancel CmdLine Job ${jobid}: finished (No job running with id ${jobid})`;
        response.state = that.STATES.finished;
        that.logger.info(`Cancel CmdLine Job ${jobid}: finished (No job running with id ${jobid})`);
        resolve(response);
      } else {
        this.runningJobs[jobid].canceled = true;
        this.runningJobs[jobid].canceledMode = mode;
        const process = this.runningJobs[jobid].process;
        const stageidx = this.runningJobs[jobid].stageidx;
        this._executeStage(jobid, stageidx, true, function onStageFinished(stopProcess, code) {
          that.logger.info(`Cancel CmdLine Job ${jobid}: finished`);
          that.logger.info(`Sending SIGKILL to process ID ${process.pid}`);
          that._kill(process.pid, 'SIGKILL', () => {
            if (callback && typeof callback === 'function') {
              response.state = that.STATES.finished;
              response.message = `Cancel CmdLine Job ${jobid}: finished`;
              response.process = stopProcess;
              response.code = code;
              callback(null, response);
            }
          });
        }).then(function onStageAcked(stageProcess) {
          response.process = stageProcess;
          response.message = `Cancel CmdLine Job ${jobid}: STARTED`;
          response.state = that.STATES.running;
          resolve(response);
        }).catch(reject);
      }
    });
  }
}

/**
 * @typedef {Job} CommandLineJob
 * @extends Job
 * @property {String} id - id of the job
 * @property {Object} nature - nature description of the job
 * @property {String} nature.quality - quality of the job
 * @property {String} nature.type - type of the job
 * @property {Object} payload - payload of the job
 * @property {Number} payload.timeout - timeout to cancel execution of the job
 * @property {Stage[]} payload.stage - array of Stage
 * @property {EnvironmentVariable[]} payload.env - environment variables to set
 */

/**
 * @typedef {Object} Stage
 * @property {String} id - id of the stage
 * @property {Number} timeout - timeout to cancel execution of the stage
 * @property {String} run - main script to execute
 * @property {String} stop - script to execute when canceling job
 * @property {String} cwd - current working directory to set
 * @property {EnvironmentVariable[]} env - environment variables to set
 */

/**
 * @typedef {Object} EnvironmentVariable
 * @property {String} key - name of the variable
 * @property {String} value - value of the variable
 */

/**
 * @typedef {Object} ChildProcess
 * @see https://nodejs.org/api/child_process.html#child_process_class_childprocess
 */

/**
 * @typedef {Object} _createFileResponse
 * @property {Number} ok - 0|1
 * @property {String} path - path to the created file
 */

exports = module.exports = CommandLine;
