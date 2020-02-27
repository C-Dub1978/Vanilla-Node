// Deps
const helpers = require('./helpers');
const http = require('http');
const https = require('https');
const _lib = require('./data');
const url = require('url');

const CHECKS_DIR = 'checks';
const MINUTE_INTERVAL = 60000;

const workers = {};

/**
 * Send an SMS message to user because of check state change
 *
 * @param {check} the health check object
 */
workers.alertUserToStateChange = check => {
  const message = `Alert! Your check for:
  ${check.method.toUpperCase()} ${check.protocol}://${check.url}
  is current and has changed to a state of '${check.state}'`;
  helpers.sendTwilioSms(check.phoneNumber, message, err => {
    if (!err) {
      console.log(message);
    } else {
      console.log('Error in SMS alert: ', err);
    }
  });
};

/**
 * Init method to get all checks and continue checking with a loop
 */
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
            workers.validateCheckData(originalCheckData);
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
workers.performCheck = check => {
  // we havent sent any http request so these properties are false
  const outcome = {
    error: false,
    responseCode: false
  };

  let outcomeSent = false;
  const parsedUrl = url.parse(check.protocol + '://' + check.url, true);
  const hostName = parsedUrl.hostname;
  // Using path not pathname because we want the full query string
  const path = parsedUrl.path;

  // Build request
  const requestDetails = {
    protocol: check.protocol + ':',
    hostname: hostName,
    method: check.method.toUpperCase(),
    path,
    timeout: check.timeoutSeconds * 1000
  };

  // Send out request via the method the user requested in their health check
  // Use either http OR https module
  const _moduleToUse = check.protocol === 'http' ? http : https;
  const req = _moduleToUse.request(requestDetails, res => {
    // Get status code
    const status = res.statusCode;
    // Update outcome object
    outcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(check, outcome);
      outcomeSent = true;
    }
  });

  // Bind to err so it doesnt get thrown
  req.on('error', err => {
    // Update outcome and pass it along
    outcome.error = { error: true, value: err };
    if (!outcomeSent) {
      workers.processCheckOutcome(check, outcome);
      outcomeSent = true;
    }
  });

  // Bind to timeout
  req.on('timeout', err => {
    // Update outcome and pass it along
    outcome.error = { error: true, value: 'timeout' };
    if (!outcomeSent) {
      workers.processCheckOutcome(check, outcome);
      outcomeSent = true;
    }
  });

  // End/send it!
  req.end();
};

/**
 * Process the check outcome, update check data as needed, trigger an alert
 * if needed. We need special logic for a check that instantiated in a down state,
 * but is brought up for the first time
 *
 * @param {check} the check
 * @param {outcome} the outcome object
 */
workers.processCheckOutcome = (check, outcome) => {
  // Is the check in an up or down state?
  const state =
    !outcome.error &&
    outcome.responseCode &&
    check.successCodes.indexOf(outcome.responseCode) > -1
      ? 'up'
      : 'down';

  // Does the current state warrant an SMS alert to the user?
  // If the lastChecked field is set, we know the check has been checked before
  // and is not newly instantiated - if so, if the state has changed, alert
  // the user.
  const alertWarranted = check.lastChecked && check.state !== state;

  // Set new check
  const newCheck = { ...check, state, lastChecked: Date.now() };

  // Update the checks collection
  _lib.update(CHECKS_DIR, newCheck.id, newCheck, err => {
    if (!err) {
      // Alert user?
      if (alertWarranted) {
        // Alert user
        workers.alertUserToStateChange(newCheck);
      } else {
        // Check state not changed, do nothing
        console.log(
          'State for check: ' +
            newCheck.id +
            ' is unchanged from ' +
            newCheck.state +
            ' state'
        );
      }
    } else {
      console.log('Error updating check ' + newCheck.id);
    }
  });
};

/**
 * Sanity checking the check data
 *
 * @param {check} the check object
 */
workers.validateCheckData = check => {
  check = helpers.confirmHealthCheckObject(check);
  check.id = helpers.confirmHealthCheckId(check.id);
  check.phoneNumber = helpers.confirmPhoneNumber(check.phoneNumber);
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
    check.phoneNumber &&
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
