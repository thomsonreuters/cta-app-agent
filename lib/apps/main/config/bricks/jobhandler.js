'use strict';
module.exports = {
  name: 'jobhandler',
  module: './bricks/jobhandler',
  properties: {},
  subscribe: [
    {
      topic: 'jobhandler.execution',
      data: [
        {
          nature: {
            type: 'executions',
          },
        },
      ],
    },
  ],
};
