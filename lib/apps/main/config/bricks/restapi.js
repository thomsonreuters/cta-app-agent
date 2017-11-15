/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

'use strict';

module.exports = {
  name: 'restapi',
  module: 'cta-restapi',
  dependencies: {
    express: 'my-express',
  },
  properties: {
    providers: [
      {
        name: 'results',
        module: './utils/restapi/handlers/results.js',
        routes: [
          {
            method: 'post', // http method get|post|put|delete
            handler: 'create', // name of the method in your provider
            path: '/results', // the route path
          },
        ],
      },
      {
        name: 'oldcta',
        module: './utils/oldrestapi/handlers/results.js',
        routes: [
          {
            method: 'post', // http method get|post|put|delete
            handler: 'createTestStatus', // name of the method in your provider
            path: '/testframework/teststatus', // the route path
          },
          {
            method: 'get', // http method get|post|put|delete
            handler: 'createTestStatus', // name of the method in your provider
            path: '/testframework/teststatus', // the route path
          },
        ],
      },
    ],
  },
  publish: [
    {
      topic: 'resultcollector.result',
      data: [
        {
          nature: {
            type: 'results',
            quality: 'create',
          },
        },
      ],
    },
  ],
};
