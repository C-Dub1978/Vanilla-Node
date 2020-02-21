// Deps
const config = require('../../config');
const helpers = require('../helpers');
const _lib = require('../data');

const HEALTH_CHECKS_DIR = 'checks';
const TOKENS_DIR = 'tokens';
const USERS_DIR = 'users';

// Module container
const checksConfirm = {
  get: (data, callback) => checksGet(data, callback),
  post: (data, callback) => checksPost(data, callback)
};

/**
 *
 * @param {*} data healthCheck id
 * @param {function} callback function
 */
function checksGet(data, callback) {
  const id = helpers.confirmHealthCheckId(data.queryString.checkId);
  if (id) {
    _lib.read(HEALTH_CHECKS_DIR, id, (err, checksData) => {
      if (!err && checksData) {
        console.log('DATA OBJECT: ', data);
        // Verify the headers token is a valid id
        const tokenId = helpers.confirmTokenId(data.headers.tokenid);
        // Verify the phone number from the healthCheck object is good
        const phoneNumber = helpers.confirmPhoneNumber(checksData.phoneNumber);
        if (tokenId && phoneNumber) {
          // Verify that the token belongs to the user who created the health check
          helpers.verifyValidToken(tokenId, phoneNumber, status => {
            if (!status) {
              // The user has a good token, and the phone number is connected to
              // the creator of the health check
              return callback(200, checksData);
            } else {
              return callback(403, {
                error: 'Cant verify that user created the health check'
              });
            }
          });
        } else {
          return callback(403, {
            error: 'Invalid or missing token header or phone number'
          });
        }
      } else {
        return callback(404, { error: 'Error reading health check' });
      }
    });
  } else {
    return callback(400, { error: 'Missing healthCheck id parameter' });
  }
}

/**
 * Health check post request
 *
 * @param {*} data protocol, url, method, successCodes, timeoutSeconds
 * @param {function} the callback function
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
                data.checks
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
                      data.checks.push(healthCheck.id);

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