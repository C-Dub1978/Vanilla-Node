// container for environments
const environments = {};

// staging (default)
environments.staging = {
  hashingSecret: 'thisIsASecret',
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  maxChecks: 5,
  twilio: {
    accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    fromPhone: '+15005550006'
  }
};

// prod
environments.production = {
  hashingSecret: 'thisIsASecret',
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production',
  maxChecks: 5,
  twilio: {
    accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    fromPhone: '+15005550006'
  }
};

// determine which environment was passed as CLI var
const currentEnv =
  typeof process.env.NODE_ENV == 'string'
    ? process.env.NODE_ENV.toLowerCase()
    : '';

// check to ensure current environment is defined otherwise set default to staging
const envExport =
  typeof environments[currentEnv] == 'object'
    ? environments[currentEnv]
    : environments.staging;

module.exports = envExport;
