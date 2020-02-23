// Entry point

// Deps
const server = require('./lib/server');
const workers = require('./lib/workers');

// Declare app
const app = {};

// Init function
app.initialize = () => {
  server.initialize();
  workers.initialize();
};

// Execute initialize function
app.initialize();

module.exports = app;
