'use strict';
const os = require('os');

class SystemDetails {

  /**
   * Return hostname of the machine with forcing lowercase
   * @returns {string}
   */
  static get hostname() {
    if (!SystemDetails._hostname) {
      // SystemDetails._hostname = asIs ? os.hostname() : os.hostname().toLowerCase();
      SystemDetails._hostname = os.hostname().toLowerCase();
    }
    return SystemDetails._hostname;
  }

  /**
   * Return actual hostname of the machine
   * @returns {string}
   */
  static getHostnameAsIS() {
    return os.hostname();
  }

  /**
   * Return ip address of the machine
   * @returns {string}
   */
  static get ip() {
    if (!SystemDetails._ip) {
      SystemDetails._ip = SystemDetails.getIP();
    }
    return SystemDetails._ip;
  }

  /**
   * Private method. Please use `Utils.ip()`
   * @returns {string}
   */
  static getIP() {
    const ifaces = os.networkInterfaces();
    let address = null;
    const ifnames = Object.keys(ifaces);
    for (let i = 0; i < ifnames.length; i++) {
      for (let j = 0; j < ifaces[ifnames[i]].length; j++) {
        const iface = ifaces[ifnames[i]][j];
        if (iface.family === 'IPv4' && iface.address !== '127.0.0.1') {
          address = iface.address;
          break;
        }
      }
      if (address !== null) {
        break;
      }
    }
    return address;
  }

  /**
   * Return os platform of the machine
   * @returns {string}
   */
  static get platform() {
    if (!SystemDetails._platform) {
      SystemDetails._platform = os.platform();
    }
    return SystemDetails._platform;
  }
}

module.exports = SystemDetails;
