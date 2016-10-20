'use strict';
const ObjectID = require('bson').ObjectID;

class RunJob {
  constructor(priority, runningTimeout) {
    const id = (new ObjectID()).toString();
    const job = {
      nature: {
        type: 'execution',
        quality: 'run',
      },
      payload: {
        execution: {
          id: id,
          priority: (priority !== undefined) && (priority !== null)
            ? priority : 2,
          runningTimeout: (runningTimeout !== undefined) && (runningTimeout !== null)
            ? runningTimeout : 20000,
        },
        testSuite: {
          id: (new ObjectID()).toString(),
          tests: [
            {
              id: (new ObjectID()).toString(),
              type: 'commandLine',
              stages: [
                {
                  id: '#1',
                  run: 'notepad.exe',
                  stop: 'echo Test - Do stop operations...',
                  timeout: 3600000,
                },
              ],
            },
            {
              id: (new ObjectID()).toString(),
              type: 'commandLine',
              stages: [
                {
                  id: '#1',
                  run: 'calc.exe',
                  stop: 'echo Test - Do stop operations...',
                  timeout: 3600000,
                },
              ],
            },
            {
              id: (new ObjectID()).toString(),
              type: 'commandLine',
              stages: [
                {
                  id: '#1',
                  run: 'notepad.exe',
                  stop: 'echo Test - Do stop operations...',
                  timeout: 3600000,
                },
              ],
            },
          ],
        },
      },
    };
    return job;
  }
}

module.exports = RunJob;
