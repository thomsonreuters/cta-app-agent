/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

'use strict';

module.exports = {
  name: 'messaging',
  module: 'cta-messaging',
  properties: {
    provider: 'rabbitmq',
    parameters: {
      url: 'amqp://localhost?heartbeat=60',
      ack: 'auto',
    },
  },
  singleton: true,
  order: 2,
};
