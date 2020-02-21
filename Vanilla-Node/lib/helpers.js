// Deps
const config = require('../config');
const crypto = require('crypto');
const _lib = require('./data');

// Helper functions
const helpers = {};

/**
 * Confirm array of checks
 *
 * @param {[]} checks the health checks array
 * @returns {[]} checks
 */
helpers.confirmHealthChecksArray = checks => {
  return typeof checks === 'object' && checks instanceof Array ? checks : [];
};

/**
 * Confirm healthCheck id
 *
 * @param {string} id the healthCheck id
 * @returns
 */
helpers.confirmHealthCheckId = id => {
  return typeof id === 'string' && id.trim().length === 20 ? id.trim() : false;
};

/**
 * Confirm extends token boolean
 *
 * @param extends
 * @returns {boolean}
 */
helpers.confirmExtendTokenBool = extend => {
  return typeof extend === 'boolean' && extend;
};

/**
 * Confirm http method
 *
 * @param {string} method
 * @returns {string} method || {boolean}
 */
helpers.confirmMethod = method => {
  return typeof method === 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(method) > -1
    ? method
    : false;
};

/**
 * Confirm first name
 *
 * @params firstName
 * @returns {string} trimmed first name || {boolean}
 */
helpers.confirmName = name => {
  return typeof name === 'string' && name.trim().length > 0
    ? name.trim()
    : false;
};

/**
 * Confirm password
 *
 * @param password
 * @returns {string} trimmed password || {boolean}
 */
helpers.confirmPassword = password => {
  return typeof password === 'string' && password.trim().length > 0
    ? password.trim()
    : false;
};

/**
 * Confirm phone number
 *
 * @param phoneNumber
 * @returns {string} trimmed phone number || {boolean}
 */
helpers.confirmPhoneNumber = phoneNumber => {
  return typeof phoneNumber === 'string' && phoneNumber.trim().length === 10
    ? phoneNumber.trim()
    : false;
};

/**
 * Confirm the http or https protocols
 *
 * @param protocol
 * @returns {string} protocol || {boolean}
 */
helpers.confirmProtocol = protocol => {
  return typeof protocol === 'string' &&
    ['http', 'https'].indexOf(protocol) > -1
    ? protocol
    : false;
};

/**
 * Confirm success codes
 *
 * @param {} codes the success codes
 * @returns {} || {boolean}
 */
helpers.confirmSuccessCodes = codes => {
  return typeof codes === 'object' && codes instanceof Array && codes.length > 0
    ? codes
    : false;
};

/**
 * Confirm timeout in seconds
 *
 * @param {number} seconds
 * @returns {number} seconds || {boolean}
 */
helpers.confirmTimeoutSeconds = seconds => {
  return typeof seconds === 'number' &&
    seconds % 1 === 0 &&
    seconds >= 1 &&
    seconds <= 5
    ? seconds
    : false;
};

/**
 * Confirm token
 *
 * @param tokenId
 * @returns string tokenId trimmed or false
 */
helpers.confirmTokenId = id => {
  return typeof id === 'string' && id.trim().length === 20 ? id.trim() : false;
};

/**
 * Confirm tosAgreement
 *
 * @param tosAgreement
 * @returns {boolean}
 */
helpers.confirmTosAgreement = tosAgreement => {
  return typeof tosAgreement === 'boolean' && tosAgreement === true;
};

/**
 * Confirm URL
 *
 * @param {string} URL
 * @returns {string} URL || {boolean}
 */
helpers.confirmUrl = url => {
  return typeof url === 'string' && url.trim().length > 0 ? url.trim() : false;
};

/**
 * Function to create a random string of letters for a token
 *
 * @params number the character length
 */
helpers.createRandomString = length => {
  const strLength = typeof length === 'number' && length > 0 ? length : 20;
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randomStr = '';
  for (let i = 0; i < strLength; i++) {
    randomStr += chars.charAt(
      Math.floor(Math.random() * Math.floor(strLength + 1))
    );
  }
  return randomStr;
};

/**
 * Hash the password string
 *
 * @param pass the password
 * @returns {string} hashed password or {boolean} false
 */
helpers.hash = pass => {
  if (typeof pass === 'string' && pass.length > 0) {
    const hash = crypto
      .createHmac('sha256', config.hashingSecret)
      .update(pass)
      .digest('hex');
    return hash;
  } else {
    return false;
  }
};

/**
 * Parse Json string to object in all cases without throwing error
 *
 * @param json the json stringified
 * @returns {} parsed json in object form
 */
helpers.parseJsonToObject = json => {
  if (typeof json === 'string' && json.length > 0) {
    try {
      return JSON.parse(json);
    } catch (err) {
      return {};
    }
  }
};

/**
 * Verify token is valid and unexpired
 *
 * @param {string, string} data the tokenId and phoneNumber
 * @returns {function} callback the callback function
 */
helpers.verifyValidToken = (tokenId, phoneNumber, callback) => {
  if (!phoneNumber || !tokenId) {
    return callback(false);
  }
  _lib.read(TOKENS_DIR, tokenId, (err, data) => {
    if (!err && data) {
      return callback(
        data.phoneNumber === phoneNumber && data.expires > Date.now()
      );
    } else {
      return callback(false);
    }
  });
};

module.exports = helpers;
