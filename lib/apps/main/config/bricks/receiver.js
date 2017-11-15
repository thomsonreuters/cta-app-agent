/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

'use strict';

const HOSTNAME = require('os').hostname();
module.exports = {
  name: 'receiver',
  module: 'cta-io',
  dependencies: {
    messaging: 'messaging',
  },
  properties: {
    input: {
      queue: `cta.${HOSTNAME}`,
    },
  },
  publish: [
    {
      topic: 'jobbroker.execution',
      data: [
        {
          nature: {
            type: 'executions',
            quality: 'run',
          },
        },
        {
          nature: {
            type: 'executions',
            quality: 'cancel',
          },
        },
        {
          nature: {
            type: 'executions',
            quality: 'read',
          },
        },
      ],
    },
    {
      topic: 'silo',
      data: [
        {
          nature: {
            type: 'documents',
            quality: 'backup',
          },
        },
        {
          nature: {
            type: 'documents',
            quality: 'restore',
          },
        },
      ],
    },
  ],
  subscribe: [
    {
      topic: 'receiver.message.acknowledge',
      data: [
        {
          nature: {
            type: 'messages',
            quality: 'acknowledge',
          },
        },
      ],
    },
    {
      topic: 'receiver.message.get',
      data: [
        {
          nature: {
            type: 'messages',
            quality: 'get',
          },
        },
      ],
    },
  ],
};
