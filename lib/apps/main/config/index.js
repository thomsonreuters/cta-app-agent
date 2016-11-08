'use strict';

const load = require('cta-common').loader;

module.exports = {
  name: 'agent',
  tools: load.asArray('tools', __dirname),
  bricks: load.asArray('bricks', __dirname),
  properties: {
    executionApiUrl: 'http://localhost:3010/',
    schedulerApiUrl: 'http://localhost:3011/',
    jobManagerApiUrl: 'http://localhost:3012/',
  },
};
