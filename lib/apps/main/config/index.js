/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

'use strict';

const load = require('cta-common').loader;

module.exports = {
  name: 'agent',
  tools: load.asArray('tools', __dirname),
  bricks: load.asArray('bricks', __dirname),
  properties: {
    executionApiUrl: 'http://localhost:3010/eds/',
    schedulerApiUrl: 'http://localhost:3011/sch/',
    jobManagerApiUrl: 'http://localhost:3012/jms/',
  },
};
