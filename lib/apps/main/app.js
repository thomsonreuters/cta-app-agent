/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

'use strict';

const FlowControl = require('cta-flowcontrol');
const Cement = FlowControl.Cement;
const config = require('./config/');
if (process.argv.length === 4) {
  const machineName = process.argv[2];
  const port = process.argv[3];
  const express = config.tools.find(tool =>
  tool.module === 'cta-expresswrapper' && tool.name === 'my-express');
  express.properties.port = parseInt(port, 10);

  const receiver = config.bricks.find(brick =>
    (brick.module === 'cta-io' && brick.name === 'receiver'));
  receiver.properties.input.queue = 'cta.' + machineName;
}
const cement = new Cement(config); // eslint-disable-line no-unused-vars
