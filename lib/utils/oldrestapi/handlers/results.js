'use strict';

const _ = require('lodash');

/**
 * Handler class for RESTAPI handlers : RESULTS
 * Converts old CTA TestStatus and StepStatus to Results objects
 * @property {CementHelper} cementHelper - cementHelper from a cta-restapi Brick
 */
class ResultsHandler {
  /**
   *
   * @param {CementHelper} cementHelper - cementHelper from a cta-restapi Brick
   */
  constructor(cementHelper) {
    this.cementHelper = cementHelper;
    this.dataType = 'results';
  }

  /**
   * Publishes request body (Result) in an result-create Context
   * @param req
   * @param res
   * @param next
   */
  createTestStatus(req, res) {
    let body;
    switch (req.method) {
      case 'GET': {
        body = req.query;
        break;
      }
      case 'POST':
      default: {
        body = req.body;
        break;
      }
    }

    const reservedKeys = ['description', 'attachment', 'build', 'screenshot'];
    const content = _.pick(body, reservedKeys);
    const customKeys = _.difference(Object.keys(body), reservedKeys);
    customKeys.forEach(function(key) {
      switch (key) {
        case 'id':
          content.testId = body.id;
          break;
        case 'status':
          content.status = body.status.toLowerCase();
          break;
        case 'message':
          content.name = body.message;
          break;
        default:
          if (!content.hasOwnProperty('custom')) {
            content.custom = [];
          }
          content.custom.push({
            key: key,
            value: body[key],
          });
          break;
      }
    });

    const data = {
      nature: {
        type: this.dataType,
        quality: 'create',
      },
      payload: content,
    };
    const context = this.cementHelper.createContext(data);
    context.on('done', function (brickname, response) {
      res.status(201).send(response);
    });
    context.once('reject', function (brickname, error) {
      res.status(400).send(error.message);
    });
    context.once('error', function (brickname, error) {
      res.status(400).send(error.message);
    });
    context.publish();
  }
}

module.exports = ResultsHandler;
