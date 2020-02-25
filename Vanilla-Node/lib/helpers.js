// Deps
const config = require('../config');
const crypto = require('crypto');
const https = require('https');
const queryString = require('querystring');

// Helper functions
const helpers = {
  /**
   * Confirm extends token boolean
   *
   * @param extends
   * @returns {boolean}
   */
  confirmExtendTokenBool: extend => {
    return typeof extend === 'boolean' && extend;
  },

  /**
   * Confirm array of checks
   *
   * @param {[]} checks the health checks array
   * @returns {[]} checks
   */
  confirmHealthChecksArray: checks => {
    return typeof checks === 'object' && checks instanceof Array ? checks : [];
  },

  /**
   * Confirm health check object
   *
   * @param
   */

  /**
   * Confirm healthCheck id
   *
   * @param {string} id the healthCheck id
   * @returns {string} || {boolean}
   */
  confirmHealthCheckId: id => {
    return typeof id === 'string' && id.trim().length === 20
      ? id.trim()
      : false;
  },

  /**
   * Confirm the health check object
   *
   * @param {check} the health check object
   * @returns {check} || {}
   */
  confirmHealthCheckObject: check => {
    return typeof check === 'object' && check != null ? check : {};
  },

  /**
   * Confirm health check state
   *
   * @param {string} state
   * @returns {boolean}
   */
  confirmHealthCheckState: state => {
    return typeof state === 'string' && ['up', 'down'].indexOf(state) > -1
      ? state
      : false;
  },

  /**
   * Confirm last checked
   *
   * @param {number} lastChecked
   * @returns {boolean}
   */
  confirmLastChecked: lastChecked => {
    return typeof lastChecked === 'number';
  },

  /**
   * Confirm http method
   *
   * @param {string} method
   * @returns {string} method || {boolean}
   */
  confirmMethod: method => {
    return typeof method === 'string' &&
      ['post', 'get', 'put', 'delete'].indexOf(method) > -1
      ? method
      : false;
  },

  /**
   * Confirm first name
   *
   * @param firstName
   * @returns {string} trimmed first name || {boolean}
   */
  confirmName: name => {
    return typeof name === 'string' && name.trim().length > 0
      ? name.trim()
      : false;
  },

  /**
   * Confirm password
   *
   * @param password
   * @returns {string} trimmed password || {boolean}
   */
  confirmPassword: password => {
    return typeof password === 'string' && password.trim().length > 0
      ? password.trim()
      : false;
  },

  /**
   * Confirm phone number
   *
   * @param phoneNumber
   * @returns {string} trimmed phone number || {boolean}
   */
  confirmPhoneNumber: phoneNumber => {
    return typeof phoneNumber === 'string' && phoneNumber.trim().length === 10
      ? phoneNumber.trim()
      : false;
  },

  /**
   * Confirm the http or https protocols
   *
   * @param protocol
   * @returns {string} protocol || {boolean}
   */
  confirmProtocol: protocol => {
    return typeof protocol === 'string' &&
      ['http', 'https'].indexOf(protocol) > -1
      ? protocol
      : false;
  },

  /**
   * Confirm success codes
   *
   * @param {} codes the success codes
   * @returns {} || {boolean}
   */
  confirmSuccessCodes: codes => {
    return typeof codes === 'object' &&
      codes instanceof Array &&
      codes.length > 0
      ? codes
      : false;
  },

  /**
   * Confirm timeout in seconds
   *
   * @param {number} seconds
   * @returns {number} seconds || {boolean}
   */
  confirmTimeoutSeconds: seconds => {
    return typeof seconds === 'number' &&
      seconds % 1 === 0 &&
      seconds >= 1 &&
      seconds <= 5
      ? seconds
      : false;
  },

  /**
   * Confirm token
   *
   * @param tokenId
   * @returns string tokenId trimmed or false
   */
  confirmTokenId: id => {
    return typeof id === 'string' && id.trim().length === 20
      ? id.trim()
      : false;
  },

  /**
   * Confirm tosAgreement
   *
   * @param tosAgreement
   * @returns {boolean}
   */
  confirmTosAgreement: tosAgreement => {
    return typeof tosAgreement === 'boolean' && tosAgreement === true;
  },

  /**
   * Confirm URL
   *
   * @param {string} URL
   * @returns {string} URL || {boolean}
   */
  confirmUrl: url => {
    return typeof url === 'string' && url.trim().length > 0
      ? url.trim()
      : false;
  },

  /**
   * Function to create a random string of letters for a token
   *
   * @param number the character length
   */
  createRandomString: length => {
    const strLength = typeof length === 'number' && length > 0 ? length : 20;
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomStr = '';
    for (let i = 0; i < strLength; i++) {
      randomStr += chars.charAt(
        Math.floor(Math.random() * Math.floor(strLength + 1))
      );
    }
    return randomStr;
  },

  /**
   * Hash the password string
   *
   * @param pass the password
   * @returns {string} hashed password or {boolean} false
   */
  hash: pass => {
    if (typeof pass === 'string' && pass.length > 0) {
      const hash = crypto
        .createHmac('sha256', config.hashingSecret)
        .update(pass)
        .digest('hex');
      return hash;
    } else {
      return false;
    }
  },

  /**
   * Parse Json string to object in all cases without throwing error
   *
   * @param json the json stringified
   * @returns {} parsed json in object form
   */
  parseJsonToObject: json => {
    if (typeof json === 'string' && json.length > 0) {
      try {
        return JSON.parse(json);
      } catch (err) {
        return {};
      }
    }
  },

  /**
   * Send SMS via twilio API
   *
   * @param {string} phoneNumber, text message
   */
  sendTwilioSms: (phoneNumber, msg, callback) => {
    const phone = helpers.confirmPhoneNumber(phoneNumber);
    const text = helpers.confirmName(msg);

    if (phone && text) {
      // Configure request payload
      const payload = {
        From: config.twilio.fromPhone,
        To: '+1' + phone,
        Body: text
      };
      // Stringify the payload using the querystring module
      const stringifiedPayload = queryString.stringify(payload);
      const reqDetails = {
        protocol: 'https:',
        hostname: 'api.twilio.com',
        method: 'POST',
        path:
          '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
        auth: config.twilio.accountSid + ':' + config.twilio.authToken,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(stringifiedPayload)
        }
      };
      // Instantiate requqest
      const req = https.request(reqDetails, res => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          callback(false);
        } else {
          callback('Status code: ', res.statusCode);
        }
      });

      // Bind to error so it doesnt get thrown
      req.on('error', err => {
        callback(err);
      });
      // Write payload to request
      req.write(stringifiedPayload);
      // Send it
      req.end();
    } else {
      callback('Invalid or missings parameters for text message');
    }
  }
};

module.exports = helpers;
