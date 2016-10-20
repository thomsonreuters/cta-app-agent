'use strict';
const ObjectID = require('bson').ObjectID;

const job = {
  nature: {
    type: 'execution',
    quality: 'run',
  },
  payload: {
    execution: {
      id: (new ObjectID()).toString(),
      priority: 2,
      runningTimeout: 3600000,
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

module.exports = job;
