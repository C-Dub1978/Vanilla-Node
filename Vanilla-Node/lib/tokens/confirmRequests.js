// Deps
const _lib = require('../data');
const helpers = require('../helpers');

// Module container
const tokensConfirm = {
  delete: (data, callback) => confirmDeleteToken(data, callback),
  get: (data, callback) => confirmGetToken(data, callback),
  post: (data, callback) => confirmPostToken(data, callback),
  put: (data, callback) => confirmPutToken(data, callback)
};

const USERS_DIR = 'users';
const TOKENS_DIR = 'tokens';

/**
 * Confirm delete request
 *
 * @param {string} data the tokenId
 * @param {function} callback the callback function
 */
function confirmDeleteToken(data, callback) {
  // Validate tokenId
  const tokenId = helpers.confirmTokenId(data.queryString.tokenId);
  if (tokenId) {
    _lib.read(TOKENS_DIR, tokenId, (err, data) => {
      if (!err && data) {
        // Delete all token data
        _lib.delete(TOKENS_DIR, tokenId, status => {
          if (!status) {
            return callback(200, { status: 'Ok deleting token data' });
          } else {
            return callback(500, { error: 'Error deleting token data' });
          }
        });
      } else {
        return callback(400, { error: 'Erro reading that token id' });
      }
    });
  } else {
    return callback(400, { error: 'Missing tokenId to validate' });
  }
}

/**
 * Confirm get request
 *
 * @param {string } data the tokenId
 * @param function callback the callback function
 */
function confirmGetToken(data, callback) {
  const tokenId = helpers.confirmTokenId(data.queryString.tokenId);
  if (tokenId) {
    _lib.read(TOKENS_DIR, tokenId, (err, data) => {
      if (!err && data) {
        return callback(200, data);
      } else {
        return callback(500, { error: 'Error reading token' });
      }
    });
  } else {
    return callback(400, {
      error: 'Missing or invalid tokenId param for get request'
    });
  }
}

/**
 * Confirm post request
 *
 * @param {string, string} data phoneNumber and password
 * @param {function} callback the callback function
 */
function confirmPostToken(data, callback) {
  const phoneNumber = helpers.confirmPhoneNumber(data.payload.phoneNumber);
  const password = helpers.confirmPassword(data.payload.password);
  if (phoneNumber && password) {
    // Look up user by phone number
    _lib.read(USERS_DIR, phoneNumber, (err, data) => {
      if (!err && data) {
        // hash password and compare to stored hash
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === data.password) {
          // phone number and password are valid, create token good for 1 hour
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObj = {
            phoneNumber,
            id: tokenId,
            expires
          };

          // Store token
          _lib.create(TOKENS_DIR, tokenId, tokenObj, status => {
            if (!status) {
              return callback(200, { status: 'Ok token post', data: tokenObj });
            } else {
              return callback(500, { error: 'Could not post token' });
            }
          });
        } else {
          return callback(400, { error: 'Invalid credentials' });
        }
      } else {
        return callback(400, { error: 'User does not exist' });
      }
    });
    // Match the user against their password
  } else {
    return callback(400, {
      error: 'Missing required parameters to post token'
    });
  }
}

/**
 * Confirm put request, ONLY used to extend a token expiration date, nothing else
 *
 * @param {string, boolean } data token id and extend boolean
 * @param {function} callback the callback function
 */
function confirmPutToken(data, callback) {
  const id = helpers.confirmTokenId(data.payload.tokenId);
  const extend = helpers.confirmExtendTokenBool(data.payload.extend);
  if (id && extend) {
    // Get token
    _lib.read(TOKENS_DIR, id, (err, data) => {
      if (!err && data) {
        // Ensure token isnt expired
        if (data.expires > Date.now()) {
          // Extend to 1 hour from now
          data.expires = Date.now() + 1000 * 60 * 60;
          // Store new token file
          _lib.update(TOKENS_DIR, id, data, status => {
            if (!status) {
              return callback(200, { status: 'Ok extending token', data });
            } else {
              return callback(500, { error: 'Error extending token' });
            }
          });
        } else {
          return callback(400, { error: 'Token is expired, cannot extend' });
        }
      } else {
        return callback(500, { error: 'Error reading token' });
      }
    });
  } else {
    return callback(400, { error: 'Missing required params in put request' });
  }
}

module.exports = tokensConfirm;
