'use strict';
const Brick = require('cta-brick');
const ResultCollectorHelper = require('./resultcollectorhelper.js');

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
    const job = context.data;
    return new Promise((resolve, reject) => {
      super.validate(context).then(() => {
        resolve({ ok: 1 });
      }).catch(reject);
    });
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
      case 'state':
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
