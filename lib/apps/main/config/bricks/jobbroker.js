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
            type: 'executions',
            quality: 'commandLine',
          },
        },
        {
          nature: {
            type: 'executions',
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
  ],
};
