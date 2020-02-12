const config = require('../config');
const crypto = require('crypto');

// Helper functions
const helpers = {};

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
  return JSON.parse(json);
};

module.exports = helpers;
