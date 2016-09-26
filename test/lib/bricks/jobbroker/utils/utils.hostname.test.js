'use strict';
const appRootPath = require('app-root-path').path;
const nodepath = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
require('sinon-as-promised');
const mockrequire = require('mock-require');

describe('JobBroker - Utils - hostname', function() {
  context('when it\'s first call', function() {
    let Utils;
    const hostname = 'Mock';
    before(function() {
      mockrequire('os',
        {
          hostname: sinon.stub().returns(hostname),
        }
      );
      Utils = mockrequire.reRequire(nodepath.join(appRootPath,
        '/lib/bricks/jobbroker/', 'utils.js'));
    });
    after(function() {
      mockrequire.stopAll();
    });
    it('should return os.hostname() value', function() {
      expect(Utils.hostname).to.equal(hostname.toLowerCase());
    });
  });

  context('when it\'s not first call', function() {
    let Utils;
    const hostname = 'mock';
    before(function() {
      Utils = mockrequire.reRequire(nodepath.join(appRootPath,
        '/lib/bricks/jobbroker/', 'utils.js'));
      Utils._hostname = hostname;
    });
    after(function() {
      mockrequire.stopAll();
    });
    it('should return stored hostname value', function() {
      expect(Utils.hostname).to.equal(hostname);
    });
  });
});
