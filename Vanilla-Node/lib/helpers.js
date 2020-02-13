const config = require('../config');
const crypto = require('crypto');

// Helper functions
const helpers = {};

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
 * Confirm tosAgreement
 *
 * @param tosAgreement
 * @returns {boolean}
 */
helpers.confirmTosAgreement = tosAgreement => {
  return typeof tosAgreement === 'boolean' && tosAgreement === true;
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
  console.log('Random string: ', randomStr);
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

module.exports = helpers;
