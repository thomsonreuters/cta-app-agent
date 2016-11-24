'use strict';
const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const ResultCollector = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'resultcollector.js'));
const ResultCollectorHelper = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'resultcollectorhelper.js'));
const DEFAULTS = {
  name: 'jobbroker',
  module: 'cta-jobbroker',
  properties: {
    priority: 100,
  },
};

describe('ResultCollector - constructor', function() {
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

  it('should return new jobHandler object', function(done) {
    expect(resultCollector).to.be.an.instanceof(ResultCollector);
    expect(resultCollector).to.have.property('resultCollectorHelper')
      .and.to.be.an.instanceof(ResultCollectorHelper);
    done();
  });
});
