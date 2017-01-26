'use strict';

const Brick = require('cta-brick');
const ResultCollectorHelper = require('./resultcollectorhelper.js');
const SystemDetails = require('../../utils/systemdetails');

/**
 * ResultCollector class
 * @class
 */
class ResultCollector extends Brick {
  /**
   * Create a new ResultCollector instance
   * @param {CementHelper} cementHelper - cementHelper instance
   * @param {Object} config - cement configuration of the brick
   */
  constructor(cementHelper, config) {
    super(cementHelper, config);

    this.instancesQueue = config.properties.instancesQueue;

    this.resultCollectorHelper = new ResultCollectorHelper(
      this.cementHelper, this.logger
    );
  }

  /**
   * Validates Job properties
   * @param {Context} context - a Context
   * @returns {Promise}
   */
  validate(context) {
    return new Promise((resolve, reject) => {
      super.validate(context).then(() => {
        resolve({ ok: 1 });
      }).catch(reject);
    });
  }

  /**
   * Sends agent report (system information, softwares, ...)
   * when brick is started
   */
  start() {
    const that = this;
    const updateInstanceJob = {
      nature: {
        type: 'instances',
        quality: 'update',
      },
      payload: {
        query: {
          hostname: SystemDetails.hostname,
        },
        content: {
          ip: SystemDetails.ip,
          properties: {
            platform: SystemDetails.platform,
            hostname: SystemDetails.hostname,
          },
        },
      },
    };
    const produceJob = {
      nature: {
        type: 'messages',
        quality: 'produce',
      },
      payload: {
        queue: that.instancesQueue,
        content: updateInstanceJob,
      },
    };
    that.cementHelper.createContext(produceJob)
      .on('done', function() {
        that.logger.info('Agent report sent.', updateInstanceJob);
      })
      .publish();
  }

  /**
   * Process the context, emit events, create new context and define listeners
   * @param context
   */
  process(context) {
    const that = this;
    const job = context.data;
    switch (job.nature.type) {
      case 'result': {
        switch (job.nature.quality) {
          case 'setRunningJob': {
            that.resultCollectorHelper.setRunningJob(context);
            break;
          }
          case 'create':
          default: {
            that.resultCollectorHelper.createResult(context);
            break;
          }
        }
        break;
      }
      case 'states':
      default: {
        switch (job.nature.quality) {
          case 'create':
          default: {
            that.resultCollectorHelper.createState(context);
            break;
          }
        }
      }
    }
  }
}

module.exports = ResultCollector;
