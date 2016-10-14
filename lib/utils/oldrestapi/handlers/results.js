'use strict';

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
    this.dataType = 'result';
  }

  /**
   * Publishes request body (Result) in an result-create Context
   * @param req
   * @param res
   * @param next
   */
  createTestStatus(req, res) {
    const content = {};
    switch (req.method) {
      case 'GET': {
        content.testId = req.query.id;
        content.status = req.query.status.toLowerCase();
        break;
      }
      case 'POST':
      default: {
        content.testId = req.body.id;
        content.status = req.body.status.toLowerCase();
        break;
      }
    }
    const data = {
      nature: {
        type: this.dataType,
        quality: 'create',
      },
      payload: content,
    };
    const context = this.cementHelper.createContext(data);
    context.publish();
    context.on('done', function (brickname, response) {
      res.status(201).send(response);
    });
    context.once('reject', function (brickname, error) {
      res.status(400).send(error.message);
    });
    context.once('error', function (brickname, error) {
      res.status(400).send(error.message);
    });
  }
}

module.exports = ResultsHandler;
