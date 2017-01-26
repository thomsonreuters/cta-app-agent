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
