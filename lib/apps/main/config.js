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
        port: 3000,
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
          'topic': 'jobbroker.execution',
          'data': [
            {
              'nature': {
                'type': 'execution',
                'quality': 'commandline',
              },
            },
            {
              'nature': {
                'type': 'execution',
                'quality': 'cancelation',
              },
            },
            {
              'nature': {
                'type': 'execution',
                'quality': 'group',
              },
            },
          ],
        },
      ],
      subscribe: [
        {
          'topic': 'receiver.execution.acknowledge',
          'data': [
            {
              'nature': {
                'type': 'message',
                'quality': 'acknowledge',
              },
            },
          ],
        },
        {
          'topic': 'receiver.queue.get',
          'data': [
            {
              'nature': {
                'type': 'message',
                'quality': 'get',
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
          'topic': 'silo',
          'data': [
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
          'topic': 'sendout',
          'data': [{}],
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
            filename: __dirname + path.sep + 'silo.db',
          },
        },
      },
      publish: [
        {
          'topic': 'sendout',
          'data': [{}],
        },
      ],
      subscribe: [
        {
          'topic': 'silo',
          'data': [
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
      'name': 'agentrestapi',
      'module': './bricks/restapi',
      'properties': {
        'port': 3001,
        'providers': [{
          name: 'cmdlineapi',
          paths: [
            '/api/*',
          ],
          module: './restapi/cmdline',
        }],
      },
      'publish': [
        {
          'topic': 'resultcollector.data',
          'data': [
            {
              'nature': {
                'type': 'teststatus',
                'quality': 'collect',
              },
            },
            {
              'nature': {
                'type': 'stepstatus',
                'quality': 'collect',
              },
            },
            {
              'nature': {
                'type': 'teststatus',
                'quality': 'captureScreen',
              },
            },
            {
              'nature': {
                'type': 'resultcollector',
                'quality': 'getRunningJobId',
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
          'topic': 'jobhandler.execution',
          'data': [
            {
              'nature': {
                'type': 'execution',
                'quality': 'commandline',
              },
            },
            {
              'nature': {
                'type': 'execution',
                'quality': 'cancelation',
              },
            },
          ],
        },
        {
          'topic': 'resultcollector.execution',
          'data': [
            {
              'nature': {
                'type': 'execution',
                'quality': 'changestate',
              },
            },
          ],
        },
        {
          'topic': 'receiver.execution.acknowledge',
          'data': [
            {
              'nature': {
                'type': 'message',
                'quality': 'acknowledge',
              },
            },
          ],
        },
        {
          'topic': 'receiver.queue.get',
          'data': [
            {
              'nature': {
                'type': 'message',
                'quality': 'get',
              },
            },
          ],
        },
      ],
      subscribe: [
        {
          'topic': 'jobbroker.execution',
          'data': [
            {
              'nature': {
                'type': 'execution',
                'quality': 'commandline',
              },
            },
            {
              'nature': {
                'type': 'execution',
                'quality': 'cancelation',
              },
            },
            {
              'nature': {
                'type': 'execution',
                'quality': 'group',
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
          'topic': 'jobhandler.execution',
          'data': [
            {
              'nature': {
                'type': 'execution',
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
          'topic': 'sendout',
          'data': [{}],
        },
      ],
      subscribe: [
        {
          'topic': 'resultcollector.execution',
          'data': [
            {
              'nature': {
                'type': 'execution',
                'quality': 'changestate',
              },
            },
            {
              'nature': {
                'type': 'execution',
                'quality': 'attachlog',
              },
            },
          ],
        },
        {
          'topic': 'resultcollector.data',
          'data': [
            {
              'nature': {
                'type': 'teststatus',
                'quality': 'collect',
              },
            },
            {
              'nature': {
                'type': 'stepstatus',
                'quality': 'collect',
              },
            },
            {
              'nature': {
                'type': 'teststatus',
                'quality': 'capturescreen',
              },
            },
            {
              'nature': {
                'type': 'resultcollector',
                'quality': 'getrunningjobid',
              },
            },
          ],
        },
      ],
    },
  ],
};

module.exports = config;
