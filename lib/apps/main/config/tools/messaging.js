'use strict';
module.exports = {
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
  order: 2,
};