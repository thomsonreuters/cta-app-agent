'use strict';
const FlowControl = require('cta-flowcontrol');
const Cement = FlowControl.Cement;
const config = require('./config/');
if (process.argv.length === 4) {
  const machineName = process.argv[2];
  const port = process.argv[3];
  const express = config.tools.find((tool) =>
  tool.module === 'cta-expresswrapper' && tool.name === 'my-express');
  express.properties.port = parseInt(port, 10);

  const receiver = config.bricks.find((brick) =>
    (brick.module === 'cta-io' && brick.name === 'receiver'));
  receiver.properties.input.queue = 'cta.' + machineName;
}
const cement = new Cement(config); // eslint-disable-line no-unused-vars
