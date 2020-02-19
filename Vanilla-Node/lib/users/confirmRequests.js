// Deps
const helpers = require('../helpers');
const _lib = require('../data');

// Module container
const usersConfirm = {
  delete: (data, callback) => confirmDeleteData(data, callback),
  get: (data, callback) => confirmGetData(data, callback),
  post: (data, callback) => confirmPostData(data, callback),
  put: (data, callback) => confirmPutData(data, callback)
};

const USERS_DIR = 'users';
const TOKENS_DIR = 'tokens';

/**
 * Confirm delete request
 *
 * @param {string} data the queryString phoneNumber
 * @param {function} callback the callback function
 */
function confirmDeleteData(data, callback) {
  const phoneNumber = helpers.confirmPhoneNumber(data.queryString.phoneNumber);
  const headerToken = helpers.confirmTokenId(data.headers.tokenid);
  if (!headerToken || !phoneNumber) {
    return callback(400, {
      error: 'Invalid token/phoneNumber or token missing from header'
    });
  }
  verifyValidToken(headerToken, phoneNumber, status => {
    if (!status) {
      return callback(400, { error: 'Invalid token, cannot delete data' });
    }
    _lib.read(USERS_DIR, phoneNumber, (err, data) => {
      if (!err && data) {
        _lib.delete(USERS_DIR, phoneNumber, status => {
          // Delete operation successful
          if (!status) {
            return callback(200, { status: 'Delete ok' });
          } else {
            return callback(500, { error: status });
          }
        });
      } else {
        return callback(400, { error: 'User not found for delete' });
      }
    });
  });
}

/**
 * Confirm get request
 *
 * @param {string} data the queryString
 * @param {function} callback the callback function
 */
function confirmGetData(data, callback) {
  const phoneNumber = helpers.confirmPhoneNumber(data.queryString.phoneNumber);
  const headerToken = helpers.confirmTokenId(data.headers.tokenid);
  if (!headerToken || !phoneNumber) {
    return callback(400, {
      error: 'Invalid credentials or missing credentials'
    });
  }
  verifyValidToken(headerToken, phoneNumber, status => {
    if (status) {
      _lib.read(USERS_DIR, phoneNumber, (err, data) => {
        if (!err && data) {
          // remove hashed password
          delete data.password;
          return callback(200, data);
        } else {
          return callback(404);
        }
      });
    } else {
      return callback(403, { error: 'Could not verify user credentials' });
    }
  });
}

/**
 * Confirm post request to create user
 *
 * @param {string, string, string, string, boolean} data the request payload
 * @param {function} callback the callback function
 */
function confirmPostData(data, callback) {
  const firstName = helpers.confirmName(data.payload.firstName);
  const lastName = helpers.confirmName(data.payload.lastName);
  const phoneNumber = helpers.confirmPhoneNumber(data.payload.phoneNumber);
  const password = helpers.confirmPassword(data.payload.password);
  const tosAgreement = helpers.confirmTosAgreement(data.payload.tosAgreement);
  if (firstName && lastName && phoneNumber && password && tosAgreement) {
    _lib.read(USERS_DIR, phoneNumber, (err, data) => {
      if (err) {
        const hashedPassword = helpers.hash(password);
        if (!hashedPassword) {
          return callback(500, { error: 'Hash error' });
        }
        // error opening file, proceed with user creation
        const newUser = {
          firstName,
          lastName,
          phoneNumber,
          password: hashedPassword
        };
        _lib.create(USERS_DIR, phoneNumber, newUser, createStatus => {
          if (!createStatus) {
            return callback(200, { status: 'ok' });
          } else {
            return callback(500, { status: createStatus });
          }
        });
      } else {
        // user already exists
        return callback(400, {
          error: 'User with that phone number already exists'
        });
      }
    });
  } else {
    return callback(400, { error: 'Missing required fields' });
  }
}

/**
 * Confirm put request
 *
 * @param {string, string, string, string} data the queryString strings
 * @param {function} callback the callback function
 */
function confirmPutData(data, callback) {
  const phoneNumber = helpers.confirmPhoneNumber(data.payload.phoneNumber);
  const firstName = helpers.confirmName(data.payload.firstName);
  const lastName = helpers.confirmName(data.payload.lastName);
  const password = helpers.confirmPassword(data.payload.password);

  const headerToken = helpers.confirmTokenId(data.headers.tokenid);
  if (!headerToken) {
    return callback(400, {
      error: 'Invalid token or token missing from header'
    });
  }
  verifyValidToken(headerToken, phoneNumber, status => {
    if (!status) {
      return callback(400, { error: 'Invalid token, cannot put data' });
    }
    // error out if we dont have both phoneNumber AND 1 of the optional params
    if (phoneNumber) {
      if (firstName || lastName || password) {
        _lib.read(USERS_DIR, phoneNumber, (err, data) => {
          if (!err && data) {
            if (firstName) {
              data.firstName = firstName;
            }
            if (lastName) {
              data.lastName = lastName;
            }
            if (password) {
              const hashedPassword = helpers.hash(password);
              if (hashedPassword) {
                data.password = hashedPassword;
              } else {
                return callback(500, { error: 'Hash error' });
              }
            }
            // Write new data
            _lib.update(USERS_DIR, phoneNumber, data, status => {
              // Successful update of data
              if (!status) {
                return callback(300, { status: 'Update ok' });
              } else {
                return callback(500, { error: status });
              }
            });
          } else {
            return callback(400, { error: 'User does not exist' });
          }
        });
      }
    } else {
      return callback(400, { error: 'Phone number invalid' });
    }
  });
}

/**
 * Verify token is valid and unexpired
 *
 * @param {string, string} data the tokenId and phoneNumber
 * @returns {function} callback the callback function
 */
function verifyValidToken(tokenId, phoneNumber, callback) {
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
}

module.exports = usersConfirm;
