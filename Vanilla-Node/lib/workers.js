// Deps
const config = require('../config');
const fs = require('fs');
const helpers = require('helpers');
const http = require('http');
const https = require('https');
const _lib = require('./data');
const path = require('path');
const url = require('url');

const CHECKS_DIR = 'checks';
const MINUTE_INTERVAL = 60000;

const workers = {};

workers.initialize = () => {
  // Execute all checks
  workers.gatherAllChecks();
  // Call the loop to continuously execute checks
  workers.loop();
};

/**
 * Look up all checks, get their info and send to validator
 */
workers.gatherAllChecks = () => {
  // Get list of checks if exist
  _lib.listDir('checks', checks => {
    if (checks && checks.length > 0) {
      checks.forEach(check => {
        // Loop through each check, get original check object
        _lib.read(CHECKS_DIR, check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            // Pass check to check validator
            workers.validateCheckData(check);
          } else {
            console.log('Error reading check in worker executor');
          }
        });
      });
    } else {
      console.log('No checks available to execute');
    }
  });
};

/**
 * Run a continuous loop to execute checks every minute
 */
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks();
  }, MINUTE_INTERVAL);
};

/**
 * Perform check on the validated health check
 *
 * @param {check} the health check
 */
workers.performCheck = check => {};

/**
 * Sanity checking the check data
 *
 * @param {check} the check object
 */
workers.validateCheckData = check => {
  check = helpers.confirmHealthCheckObject(check);
  check.id = helpers.confirmHealthCheckId(check.id);
  check.phone = helpers.confirmPhoneNumber(check.phoneNumber);
  check.protocol = helpers.confirmProtocol(check.protocol);
  check.url = helpers.confirmUrl(check.url);
  check.method = helpers.confirmMethod(check.method);
  check.successCodes = helpers.confirmSuccessCodes(check.successCodes);
  check.timeoutSeconds = helpers.confirmTimeoutSeconds(check.timeoutSeconds);

  // Set the keys that may NOT be set if the workers have never seen the check before
  check.state = helpers.confirmHealthCheckState(check.state);
  check.lastChecked = helpers.confirmLastChecked(check.lastChecked);

  // If all checks pass, pass data to next step in validation process
  if (
    check.id &&
    check.phone &&
    check.protocol &&
    check.url &&
    check.method &&
    check.successCodes &&
    check.timeoutSeconds
  ) {
    workers.performCheck(check);
  } else {
    console.log('Invalid check object');
  }
};

module.exports = workers;
