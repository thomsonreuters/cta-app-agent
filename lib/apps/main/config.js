'use strict';
const path = require('path');

const config = {
  name: 'agent',
  /**
   * Tools
   */
  tools: [
    {
      name: 'logger',
      module: 'cta-logger',
      properties: {
        level: 'debug',
      },
      scope: 'all',
    },
    {
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
    },
    {
      name: 'my-express',
      module: 'cta-expresswrapper',
      properties: {
        port: 3001,
      },
      singleton: true,
    },
    {
      name: 'healthcheck',
      module: 'cta-healthcheck',
      properties: {
        queue: 'healthcheck',
      },
      dependencies: {
        messaging: 'messaging',
        express: 'my-express',
      },
      scope: 'bricks',
      singleton: true,
    },
  ],
  /**
   * Bricks
   */
  bricks: [
    {
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
    },
    {
      name: 'sender',
      module: 'cta-io',
      dependencies: {
        messaging: 'messaging',
      },
      properties: {
        output: {
          queue: 'cta.status',
        },
      },
      publish: [
        {
          topic: 'silo',
          data: [
            {
              nature: {
                type: 'teststatus',
                quality: 'save',
              },
            },
            {
              nature: {
                type: 'teststatus',
                quality: 'read',
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
                type: 'message',
                quality: 'produce',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'silo',
      module: 'cta-silo',
      properties: {
        provider: {
          name: 'nedb',
          options: {
            filename: `${__dirname}/${path.sep}/silo.db`,
          },
        },
      },
      publish: [
        {
          topic: 'sendout',
          data: [{}],
        },
      ],
      subscribe: [
        {
          topic: 'silo',
          data: [
            {
              nature: {
                type: 'teststatus',
                quality: 'save',
              },
            },
            {
              nature: {
                type: 'teststatus',
                quality: 'read',
              },
            },
          ],
        },
      ],
    },
    {
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
                quality: 'cancelation',
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
    },
    {
      name: 'jobhandler',
      module: './bricks/jobhandler',
      properties: {},
      subscribe: [
        {
          topic: 'jobhandler.execution',
          data: [
            {
              nature: {
                type: 'execution',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'resultcollector',
      module: './bricks/resultcollector',
      properties: {},
      publish: [
        {
          topic: 'sendout',
          data: [{}],
        },
      ],
      subscribe: [
        {
          topic: 'resultcollector.execution',
          data: [
            {
              nature: {
                type: 'execution',
                quality: 'changestate',
              },
            },
            {
              nature: {
                type: 'execution',
                quality: 'attachlog',
              },
            },
          ],
        },
        {
          topic: 'resultcollector.data',
          data: [
            {
              nature: {
                type: 'teststatus',
                quality: 'collect',
              },
            },
            {
              nature: {
                type: 'stepstatus',
                quality: 'collect',
              },
            },
            {
              nature: {
                type: 'teststatus',
                quality: 'capturescreen',
              },
            },
            {
              nature: {
                type: 'resultcollector',
                quality: 'getrunningjobid',
              },
            },
          ],
        },
      ],
    },
  ],
};

module.exports = config;
