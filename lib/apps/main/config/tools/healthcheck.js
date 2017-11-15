/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

'use strict';

module.exports = {
  name: 'healthcheck',
  module: 'cta-healthcheck',
  properties: {
    queue: 'cta.hck',
  },
  dependencies: {
    messaging: 'messaging',
    express: 'my-express',
  },
  scope: 'bricks',
  singleton: true,
  order: 4,
};
