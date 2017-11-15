/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

'use strict';

module.exports = {
  name: 'sender',
  module: 'cta-io',
  dependencies: {
    messaging: 'messaging',
  },
  properties: {
    output: {
      queue: 'cta.eds.statuses',
    },
  },
  publish: [
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
      topic: 'sender.message.produce',
      data: [
        {
          nature: {
            type: 'messages',
            quality: 'produce',
          },
        },
      ],
    },
  ],
};
