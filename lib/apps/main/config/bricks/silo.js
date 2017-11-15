/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

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
};
