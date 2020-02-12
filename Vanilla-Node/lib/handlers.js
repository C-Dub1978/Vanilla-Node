// Deps
const helpers = require('./helpers');
const _lib = require('./data');

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
// required data: firstName, lastName, phone, password, tosAgreement
handlers._users = {
  post: (data, callback) => {
    return confirmData(data, callback);
  },
  get: (data, callback) => {},
  put: (data, callback) => {},
  delete: (data, callback) => {}
};

function confirmData(data, callback) {
  console.log('payload: ', data);
  const firstName =
    typeof data.payload.firstName === 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName === 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const phoneNumber =
    typeof data.payload.phoneNumber === 'string' &&
    data.payload.phoneNumber.trim().length === 10
      ? data.payload.phoneNumber
      : false;
  const password =
    typeof data.payload.password === 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  const tosAgreement =
    typeof data.payload.tosAgreement === 'boolean' &&
    data.payload.tosAgreement === true
      ? true
      : false;
  console.log(
    firstName,
    ', ',
    lastName,
    ', ',
    phoneNumber,
    ', ',
    password,
    ', ',
    tosAgreement
  );
  if (firstName && lastName && phoneNumber && password && tosAgreement) {
    _lib.read('users', phoneNumber, (err, data) => {
      if (err) {
        const hashedPassword = helpers.hash(password);
        if (!hashedPassword) {
          return callback(500, { error: 'Hash error' });
        }
        // error opening file, proceed with user creation
        const newUser = {
          firstName: firstName,
          lastName: lastName,
          phoneNumber: phoneNumber,
          password: hashedPassword
        };
        _lib.create('users', phoneNumber, newUser, createStatus => {
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

module.exports = handlers;
