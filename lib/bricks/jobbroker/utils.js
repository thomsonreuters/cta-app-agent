'use strict';
const os = require('os');

class Utils {

  /**
   * Return hostname of the machine
   * @returns {string}
   */
  static get hostname() {
    if (!Utils._hostname) {
      Utils._hostname = os.hostname().toLowerCase();
    }
    return Utils._hostname;
  }

  /**
   * Return ip address of the machine
   * @returns {string}
   */
  static get ip() {
    if (!Utils._ip) {
      Utils._ip = Utils.getIP();
    }
    return Utils._ip;
  }

  /**
   * Private method. Please use `Utils.ip()`
   * @returns {string}
   */
  static getIP() {
    const ifaces = os.networkInterfaces();
    for (const ifname in ifaces) {
      for (let i = 0; i < ifaces[ifname].length; i++) {
        const iface = ifaces[ifname][i];
        if (iface.family === 'IPv4' && iface.address !== '127.0.0.1') {
          return iface.address;
        }
      }
    }
  }
}

module.exports = Utils;
