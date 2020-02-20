// Deps
const config = require('../../config');
const helpers = require('../helpers');
const _lib = require('../data');

const HEALTH_CHECKS_DIR = 'checks';
const TOKENS_DIR = 'tokens';
const USERS_DIR = 'users';

// Module container
const checksConfirm = {
  post: (data, callback) => checksPost(data, callback)
};

/**
 * Health check post request
 *
 * @param {*} data protocol, url, method, successCodes, timeoutSeconds
 * @param {function} callback the callback function
 */
function checksPost(data, callback) {
  const protocol = helpers.confirmProtocol(data.payload.protocol);
  const url = helpers.confirmUrl(data.payload.url);
  const method = helpers.confirmMethod(data.payload.method);
  const successCodes = helpers.confirmSuccessCodes(data.payload.successCodes);
  const timeoutSeconds = helpers.confirmTimeoutSeconds(
    data.payload.timeoutSeconds
  );
  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get header token to validate user
    const tokenId = helpers.confirmTokenId(data.headers.tokenid);
    if (tokenId) {
      _lib.read(TOKENS_DIR, tokenId, (err, data) => {
        if (!err && data) {
          // We have a phone number, read it to get a user
          const phoneNumber = data.phoneNumber;
          _lib.read(USERS_DIR, phoneNumber, (err, data) => {
            if (!err && data) {
              // We have a user, identify which checks, if any, are in place
              const healthChecks = helpers.confirmHealthChecksArray(
                data.healthChecks
              );
              if (healthChecks.length < config.maxChecks) {
                // Create a random id for the health check
                const randomId = helpers.createRandomString(20);
                // Create a health check with reference to its creator
                const healthCheck = {
                  id: randomId,
                  phoneNumber,
                  protocol,
                  url,
                  method,
                  successCodes,
                  timeoutSeconds
                };
                _lib.create(
                  HEALTH_CHECKS_DIR,
                  randomId,
                  healthCheck,
                  status => {
                    if (!status) {
                      // sync the user data with their healthChecks
                      data.checks = healthChecks;
                      data.checks.push(healthCheck);

                      // save/update new user data
                      _lib.update(USERS_DIR, phoneNumber, data, status => {
                        if (!status) {
                          return callback(200, healthCheck);
                        } else {
                          return callback(500, {
                            error: 'Error writing updated health check data'
                          });
                        }
                      });
                    } else {
                    }
                  }
                );
              } else {
                // The user has already maxed out the number of health
                // checks they can add to their account
                return callback(400, {
                  error: 'Cannot add any more health checks'
                });
              }
            } else {
              return callback(403, { error: 'Error reading that user' });
            }
          });
        } else {
          // Cant get user data from token
          return callback(403, {
            error: 'Cannot validate that token for checks post'
          });
        }
      });
    } else {
      return callback(400, {
        error: 'Unable to authenticate token for post check'
      });
    }
  } else {
    return callback(400, { error: 'Missing required params for check' });
  }
}

module.exports = checksConfirm;
