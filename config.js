// container for environments
const environments = {};

// staging (default)
environments.staging = {
  port: 3000,
  envName: 'staging'
};

// prod
environments.production = {
  port: 5000,
  envName: 'production'
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
