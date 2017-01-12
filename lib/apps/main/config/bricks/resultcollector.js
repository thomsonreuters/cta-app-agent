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
            type: 'message',
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
  ],
};
