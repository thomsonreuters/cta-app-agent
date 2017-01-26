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

describe('SystemDetails - ip', function() {
  context('when it\'s first call', function() {
    let SystemDetails;
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
        {
          address: '10.10.10.2',
          netmask: '255.255.254.0',
          family: 'IPv4',
          mac: '34:e6:d7:02:19:c5',
          internal: false,
        },
      ],
      2: [
        {
          address: '10.10.10.3',
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
        },
      );
      SystemDetails = mockrequire.reRequire(nodepath.join(appRootPath,
        '/lib/utils/systemdetails/', 'index.js'));
    });
    after(function() {
      mockrequire.stopAll();
    });
    it('should return first interface non-local ipv4 address value', function() {
      expect(SystemDetails.ip).to.equal(interfaces['1'][2].address);
    });
  });

  context('when it\'s not first call', function() {
    let SystemDetails;
    const ip = '10.10.10.10';
    before(function() {
      SystemDetails = mockrequire.reRequire(nodepath.join(appRootPath,
        '/lib/utils/systemdetails/', 'index.js'));
      SystemDetails._ip = ip;
    });
    it('should return stored ip value', function() {
      expect(SystemDetails.ip).to.equal(ip);
    });
  });
});
