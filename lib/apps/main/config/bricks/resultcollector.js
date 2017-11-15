/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

'use strict';

module.exports = {
  name: 'resultcollector',
  module: './bricks/resultcollector',
  properties: {
    instancesQueue: 'cta.ids.instances',
  },
  publish: [
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
  subscribe: [
    {
      topic: 'resultcollector.result',
      data: [
        {
          nature: {
            type: 'results',
            quality: 'setRunningJob',
          },
        },
        {
          nature: {
            type: 'results',
            quality: 'create',
          },
        },
      ],
    },
    {
      topic: 'resultcollector.state',
      data: [
        {
          nature: {
            type: 'states',
            quality: 'create',
          },
        },
      ],
    },
  ],
};
