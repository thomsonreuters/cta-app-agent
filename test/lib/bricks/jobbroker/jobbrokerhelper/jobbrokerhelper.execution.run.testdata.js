'use strict';
const ObjectID = require('bson').ObjectID;

class RunJob {
  constructor(priority, runningTimeout, pendingTimeout) {
    const id = (new ObjectID()).toString();
    const job = {
      nature: {
        type: 'executions',
        quality: 'run',
      },
      payload: {
        execution: {
          id: id,
          priority: (priority !== undefined) && (priority !== null)
            ? priority : 2,
          runningTimeout: (runningTimeout !== undefined) && (runningTimeout !== null)
            ? runningTimeout : 20000,
          pendingTimeout: (pendingTimeout !== undefined) && (pendingTimeout !== null)
            ? pendingTimeout : 20000,
          requestTimestamp: Date.now(),
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
