'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const ResultCollector = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'resultcollector.js'));
const DEFAULTS = {
  name: 'jobbroker',
  module: 'cta-jobbroker',
  properties: {
    priority: 100,
  },
};

describe('ResultCollector - validate', function() {
  let resultCollector;
  const mockCementHelper = {
    constructor: {
      name: 'CementHelper',
    },
    brickName: 'resultCollector',
  };
  before(function() {
    resultCollector = new ResultCollector(mockCementHelper, DEFAULTS);
  });

  context('when everything ok', function() {
    let promise;
    const job = {};
    const context = { data: job };
    before(function() {
      promise = resultCollector.validate(context);
    });
    it('should resolve', function() {
      expect(promise).to.eventually.equal({ ok: 1 });
    });
  });
});

