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

describe('SystemDetails - hostname', function() {
  context('when it\'s first call', function() {
    let SystemDetails;
    const hostname = 'Mock';
    before(function() {
      mockrequire('os',
        {
          hostname: sinon.stub().returns(hostname),
        },
      );
      SystemDetails = mockrequire.reRequire(nodepath.join(appRootPath,
        '/lib/utils/systemdetails/', 'index.js'));
    });
    after(function() {
      mockrequire.stopAll();
    });
    it('should return os.hostname() value', function() {
      expect(SystemDetails.hostname).to.equal(hostname.toLowerCase());
    });
  });

  context('when it\'s not first call', function() {
    let SystemDetails;
    const hostname = 'mock';
    before(function() {
      SystemDetails = mockrequire.reRequire(nodepath.join(appRootPath,
        '/lib/utils/systemdetails/', 'index.js'));
      SystemDetails._hostname = hostname;
    });
    after(function() {
      mockrequire.stopAll();
    });
    it('should return stored hostname value', function() {
      expect(SystemDetails.hostname).to.equal(hostname);
    });
  });
});
