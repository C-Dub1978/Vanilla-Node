// Deps
const helpers = require('./helpers');
const _lib = require('./data');

const USER_DIR = 'users';

// Define request handlers
const handlers = {
  notFound: (data, callback) => {
    callback(404);
  },
  ping: (data, callback) => {
    callback(200, { status: 'alive' });
  },
  users: (data, callback) => {
    // Only accept the following http methods
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
      handlers._users[data.method](data, callback);
    } else {
      callback(405);
    }
  }
};

// users route submethods
handlers._users = {
  // required data: phoneNumber
  // TODO only let authenticated user delete their own data
  // TODO clean up ALL files and data associated with this user
  delete: (data, callback) => {
    return confirmDeleteData(data, callback);
  },
  // required data: phoneNumber - TODO only let authenticated user
  // access their own data object, not anyone elses
  get: (data, callback) => {
    return confirmGetData(data, callback);
  },
  // required data: firstName, lastName, phone, password, tosAgreement
  post: (data, callback) => {
    return confirmPostData(data, callback);
  },
  // required data: phoneNumber
  // optional data: first, last, pass - at least 1 MUST be specified to put/update
  // TODO only let authenticated user update their own data
  put: (data, callback) => {
    return confirmPutData(data, callback);
  }
};

/**
 * Confirm delete request
 *
 * @param {*} data the queryString
 * @param function callback the callback function
 */
function confirmDeleteData(data, callback) {
  const phoneNumber = helpers.confirmPhoneNumber(data.queryString.phoneNumber);
  if (phoneNumber) {
    _lib.read(USER_DIR, phoneNumber, (err, data) => {
      if (!err && data) {
        _lib.delete(USER_DIR, phoneNumber, status => {
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
  } else {
    return callback(400, { error: 'Missing phone number to delete' });
  }
}

/**
 * Confirm get request
 *
 * @param {*} data the queryString
 * @param function callback the callback function
 */
function confirmGetData(data, callback) {
  const phoneNumber = helpers.confirmPhoneNumber(data.queryString.phoneNumber);
  if (phoneNumber) {
    _lib.read(USER_DIR, phoneNumber, (err, data) => {
      if (!err && data) {
        // remove hashed password
        delete data.password;
        return callback(200, data);
      } else {
        return callback(404);
      }
    });
  } else {
  }
}

/**
 * Confirm post request to create user
 *
 * @param {*} data the request payload
 * @param function callback the callback function
 */
function confirmPostData(data, callback) {
  const firstName = helpers.confirmName(data.payload.firstName);
  const lastName = helpers.confirmName(data.payload.lastName);
  const phoneNumber = helpers.confirmPhoneNumber(data.payload.phoneNumber);
  const password = helpers.confirmPassword(data.payload.password);
  const tosAgreement = helpers.confirmTosAgreement(data.payload.tosAgreement);
  if (firstName && lastName && phoneNumber && password && tosAgreement) {
    _lib.read(USER_DIR, phoneNumber, (err, data) => {
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
        _lib.create(USER_DIR, phoneNumber, newUser, createStatus => {
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
 * @param {*} data the queryString
 * @param function callback the callback function
 */
function confirmPutData(data, callback) {
  const phoneNumber = helpers.confirmPhoneNumber(data.payload.phoneNumber);
  const firstName = helpers.confirmName(data.payload.firstName);
  const lastName = helpers.confirmName(data.payload.lastName);
  const password = helpers.confirmPassword(data.payload.password);

  // error out if we dont have both phoneNumber AND 1 of the optional params
  if (phoneNumber) {
    if (firstName || lastName || password) {
      _lib.read(USER_DIR, phoneNumber, (err, data) => {
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
          _lib.update(USER_DIR, phoneNumber, data, status => {
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
    return callback(400, { error: 'Missing phone number' });
  }
}

module.exports = handlers;
