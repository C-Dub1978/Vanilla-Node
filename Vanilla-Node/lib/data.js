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
 * Make sure directory structure exists
 */
lib.initialize = () => {
  // Ensure the .data directory exists, if not, create
  fs.readdir(path.join(__dirname, '../.data'), err => {
    if (err) {
      fs.mkdir(path.join(__dirname, '../.data'), err => {
        if (err) {
          console.log('Error creating .dir directory');
          process.exit(1);
        } else {
          console.log('.data directory created successfully');
          // Ensure that checks directory exists, if not, create
          fs.readdir(path.join(__dirname, '../.data/checks'), err => {
            if (err) {
              // Create it
              fs.mkdir(path.join(__dirname, '../.data/checks'), err => {
                if (err) {
                  console.log('Error creating checks directory');
                } else {
                  console.log('Checks directory created successfully');
                }
              });
            } else {
              console.log('Checks directory already exists');
            }
          });

          // Ensure that tokens directory exists, if not, create
          fs.readdir(path.join(__dirname, '../.data/tokens'), err => {
            if (err) {
              // Create it
              fs.mkdir(path.join(__dirname, '../.data/tokens'), err => {
                if (err) {
                  console.log('Error creating tokens directory');
                  process.exit(1);
                } else {
                  console.log('Tokens directory created successfully');
                }
              });
            } else {
              console.log('Tokens directory already exists');
            }
          });

          // Ensure that users directory exists, if not, create
          fs.readdir(path.join(__dirname, '../.data/users'), err => {
            if (err) {
              // Create it
              fs.mkdir(path.join(__dirname, '../.data/users'), err => {
                if (err) {
                  console.log('Error creating users directory');
                  process.exit(1);
                } else {
                  console.log('Users directory created successfully');
                }
              });
            } else {
              console.log('Users directory already exists');
            }
          });
        }
      });
    } else {
      console.log('.data directory already exists');
    }
  });
};

/**
 * List all files in a specific directory
 *
 * @param {string} dir, the directory
 * @param {function} the callback function
 */
lib.listDir = (directory, callback) => {
  return typeof directory === 'string'
    ? fs.readdir(lib.baseDir + directory + '/', (err, files) => {
        if (!err && files && files.length > 0) {
          // Trim the extension off each file
          const trimmed = [];
          files.forEach(file => {
            let splitFile = file.split('.');
            trimmed.push(splitFile[0]);
          });
          return callback(trimmed);
        } else {
          // Error reading, return false
          return callback(false);
        }
      })
    : callback(false);
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
