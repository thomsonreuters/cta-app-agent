'use strict';
module.exports = {
  name: 'receiver',
  module: 'cta-io',
  dependencies: {
    messaging: 'messaging',
  },
  properties: {
    input: {
      queue: 'cta.mymachine',
    },
  },
  publish: [
    {
      topic: 'jobbroker.execution',
      data: [
        {
          nature: {
            type: 'execution',
            quality: 'run',
          },
        },
        {
          nature: {
            type: 'execution',
            quality: 'cancel',
          },
        },
        {
          nature: {
            type: 'execution',
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
            type: 'document',
            quality: 'backup',
          },
        },
        {
          nature: {
            type: 'document',
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
            type: 'message',
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
            type: 'message',
            quality: 'get',
          },
        },
      ],
    },
  ],
};
