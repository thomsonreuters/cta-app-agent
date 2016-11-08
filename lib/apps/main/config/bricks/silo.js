'use strict';
const path = require('path');
module.exports = {
  name: 'silo',
  module: 'cta-silo',
  properties: {
    filename: `${__dirname}/${path.sep}/silo.db`,
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
};