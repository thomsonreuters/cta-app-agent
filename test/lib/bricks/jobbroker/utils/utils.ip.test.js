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

describe('JobBroker - Utils - ip', function() {
  context('when it\'s first call', function() {
    let Utils;
    const interfaces = {
      1: [
        {
          address: 'fe80::a9a5:33bb:37ee:b83',
          netmask: 'ffff:ffff:ffff:ffff::',
          family: 'IPv6',
          mac: '34:e6:d7:02:19:c5',
          scopeid: 19,
          internal: false,
        },
        {
          address: '127.0.0.1',
          netmask: '255.255.254.0',
          family: 'IPv4',
          mac: '34:e6:d7:02:19:c5',
          internal: false,
        },
        {
          address: '10.10.10.1',
          netmask: '255.255.254.0',
          family: 'IPv4',
          mac: '34:e6:d7:02:19:c5',
          internal: false,
        },
      ],
      2: [
        {
          address: '10.10.10.2',
          netmask: '255.255.254.0',
          family: 'IPv4',
          mac: '34:e6:d7:02:19:c5',
          internal: false,
        },
      ],
    };
    before(function() {
      mockrequire('os',
        {
          networkInterfaces: sinon.stub().returns(interfaces),
        }
      );
      Utils = mockrequire.reRequire(nodepath.join(appRootPath,
        '/lib/bricks/jobbroker/', 'utils.js'));
    });
    after(function() {
      mockrequire.stopAll();
    });
    it('should return first interface non-local ipv4 address value', function() {
      expect(Utils.ip).to.equal(interfaces['1'][2].address);
    });
  });

  context('when it\'s not first call', function() {
    let Utils;
    const ip = '10.10.10.10';
    before(function() {
      Utils = mockrequire.reRequire(nodepath.join(appRootPath,
        '/lib/bricks/jobbroker/', 'utils.js'));
      Utils._ip = ip;
    });
    it('should return stored ip value', function() {
      expect(Utils.ip).to.equal(ip);
    });
  });
});
