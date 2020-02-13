// Deps
const _lib = require('../data');
const helpers = require('../helpers');

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
 * @param {*} data
 * @param function callback the callback function
 */
function confirmDeleteToken(data, callback) {}

/**
 * Confirm get request
 *
 * @param data
 * @param function callback the callback function
 */
function confirmGetToken() {}

/**
 * Confirm post request
 *
 * @param data
 * @param function callback the callback function
 */
function confirmPostToken(data, callback) {
  console.log('Payload: ', data.payload);
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
              return callback(200, { status: 'Ok token post' });
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
 * Confirm put request
 *
 * @param data
 * @param function callback the callback function
 */
function confirmPutToken() {}

module.exports = tokensConfirm;
