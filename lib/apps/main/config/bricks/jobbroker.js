'use strict';
module.exports = {
  name: 'jobbroker',
  module: './bricks/jobbroker',
  properties: {},
  publish: [
    {
      topic: 'jobhandler.execution',
      data: [
        {
          nature: {
            type: 'execution',
            quality: 'commandLine',
          },
        },
        {
          nature: {
            type: 'execution',
            quality: 'cancel',
          },
        },
      ],
    },
    {
      topic: 'resultcollector.result',
      data: [
        {
          nature: {
            type: 'result',
            quality: 'setRunningJob',
          },
        },
        {
          nature: {
            type: 'result',
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
            type: 'state',
            quality: 'create',
          },
        },
      ],
    },
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
    {
      topic: 'sender.message.produce',
      data: [
        {
          nature: {
            type: 'message',
            quality: 'produce',
          },
        },
      ],
    },
  ],
  subscribe: [
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
  ],
};
