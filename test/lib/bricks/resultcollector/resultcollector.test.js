'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const chai = require('chai');
const expect = chai.expect;
const ResultCollector = require(nodepath.join(appRootPath,
  '/lib/bricks/resultcollector/', 'resultcollector.js'));

chai.use(require('chai-as-promised'));

const resultCollector = new ResultCollector({}, {name: 'resultcollector'});

describe('Result Collector Brick', function() {
  it('should reject an "missing nature object" error', function() {
    const job = {};
    const context = { data: job };
    return expect(resultCollector.validate(context))
      .to.be.rejected.and.then((err) => {
        expect(err.message).equal('missing/incorrect \'nature\' object property in job');
      });
  });

  it('should reject an "type not supported" error', function() {
    const job = {
      nature: {
        quality: 'foo',
        type: 'bar',
      },
      payload: {},
    };
    const context = { data: job };
    return expect(resultCollector.validate(context))
      .to.be.rejected.and.then((err) => {
        expect(err.message).equal('type ' + job.nature.type + ' not supported');
      });
  });

  it('should reject an "quality not supported" error', function() {
    const job = {
      nature: {
        quality: 'foo',
        type: 'execution',
      },
      payload: {},
    };
    const context = { data: job };
    return expect(resultCollector.validate(context))
      .to.be.rejected.and.then((err) => {
        expect(err.message).equal('quality ' + job.nature.quality + ' not supported for type execution');
      });
  });

  it('should store apiName as lowercase', function() {
    const apiName = 'Execution';
    resultCollector.getApi(apiName);
    expect(resultCollector.apis[apiName]).to.be.an('undefined');
    expect(resultCollector.apis[apiName.toLowerCase()]).to.not.be.an('undefined');
    expect(ResultCollector.runningJobs).to.be.an.instanceof(Set);
  });
});
