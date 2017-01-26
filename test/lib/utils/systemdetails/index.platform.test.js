'use strict';

const appRootPath = require('cta-common').root('cta-app-agent');
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');
const mockrequire = require('mock-require');

describe('SystemDetails - platform', function() {
  context('when it\'s first call', function() {
    let SystemDetails;
    const platform = 'Mock';
    before(function() {
      mockrequire('os',
        {
          platform: sinon.stub().returns(platform),
        }
      );
      SystemDetails = mockrequire.reRequire(nodepath.join(appRootPath,
        '/lib/utils/systemdetails/', 'index.js'));
    });
    after(function() {
      mockrequire.stopAll();
    });
    it('should return os.platform() value', function() {
      expect(SystemDetails.platform).to.equal(platform);
    });
  });

  context('when it\'s not first call', function() {
    let SystemDetails;
    const platform = 'mock';
    before(function() {
      SystemDetails = mockrequire.reRequire(nodepath.join(appRootPath,
        '/lib/utils/systemdetails/', 'index.js'));
      SystemDetails._platform = platform;
    });
    after(function() {
      mockrequire.stopAll();
    });
    it('should return stored platform value', function() {
      expect(SystemDetails.platform).to.equal(platform);
    });
  });
});
