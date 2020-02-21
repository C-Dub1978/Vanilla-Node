// Define deps
const fs = require('fs');
const helpers = require('./helpers');
const path = require('path');

// Module container
const lib = {};

// Define base dir - __dirname is where we are now
lib.baseDir = path.join(__dirname, '/../.data/');

/**
 * Creation function.
 *
 * @param dir the subDir to write to
 * @param fileName name of the file
 * @param data the payload to write
 * @param callback callback Fn
 */
lib.create = (dir, fileName, data, callback) => {
  // Open our baseDir append the new subDir to it, with a slash, and a filename
  fs.open(
    lib.baseDir + dir + '/' + fileName + '.json',
    'wx',
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Convert payload to string
        const strData = JSON.stringify(data);
        // Write to file, then close (dont forget to close!)
        fs.writeFile(fileDescriptor, strData, err => {
          if (!err) {
            fs.close(fileDescriptor, err => {
              if (!err) {
                callback(false);
              } else {
                callback('Error closing new file');
              }
            });
          } else {
            callback('Error writing to new file');
          }
        });
      } else {
        callback('Error creating new file, it may already exist: ');
      }
    }
  );
};

/**
 * Delete operation
 *
 * @param dir the directory to search
 * @param file the filename to open
 * @param callback the callback function
 */
lib.delete = (dir, file, callback) => {
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', err => {
    if (!err) {
      callback(false);
    } else {
      callback('Error unlinking file from file system');
    }
  });
};

/**
 * Read function
 *
 * @param dir the directory to find the file to open
 * @param file the file to open
 * @param callback the callback function
 */
lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
    if (!err && data) {
      const obj = helpers.parseJsonToObject(data);
      callback(false, obj);
    } else {
      callback(err, data);
    }
  });
};

/**
 * Edit/update function
 *
 * @param dir the directory to search
 * @param file the file to open
 * @param data the data to write to the file
 * @param callback the callback fn
 */
lib.update = (dir, file, data, callback) => {
  fs.open(
    lib.baseDir + dir + '/' + file + '.json',
    'r+',
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        const strData = JSON.stringify(data);
        // Truncate contents of file
        fs.truncate(fileDescriptor, err => {
          if (!err) {
            fs.writeFile(fileDescriptor, strData, err => {
              if (!err) {
                fs.close(fileDescriptor, err => {
                  if (!err) {
                    callback(false);
                  } else {
                    callback('Error closing file');
                  }
                });
              } else {
                callback('Error writing to existing file');
              }
            });
          } else {
            callback('Error truncating file for writing to');
          }
        });
      } else {
        callback('Could not open file for updating');
      }
    }
  );
};

/**
 *
 */
lib.verifyValidToken = (tokenId, phoneNumber, callback) => {
  if (!phoneNumber || !tokenId) {
    return callback(false);
  }
  lib.read('tokens', tokenId, (err, data) => {
    if (!err && data) {
      return callback(
        data.phoneNumber === phoneNumber && data.expires > Date.now()
      );
    } else {
      return callback(false);
    }
  });
};

module.exports = lib;
