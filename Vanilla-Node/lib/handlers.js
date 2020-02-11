// Deps

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
  post: (data, callback) => {},
  get: (data, callback) => {},
  put: (data, callback) => {},
  delete: (data, callback) => {}
};

function confirmData(data) {
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
}

module.exports = handlers;
