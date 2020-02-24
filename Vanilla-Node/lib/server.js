// Server related tasks

// Deps
const config = require('../config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const http = require('http');
const https = require('https');
const _lib = require('./data');
const path = require('path');
const url = require('url');
// for payloads
const stringDecoder = require('string_decoder').StringDecoder;

// Instantiate server module
const server = {};

// create httpsOptions
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '../../certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../../certs/cert.pem'))
};

// Servers should response to GET, POST, PUT, DELTE, HEAD - instantiate them
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

server.httpsServer = https.createServer(
  server.httpsServerOptions,
  (req, res) => {
    server.unifiedServer(req, res);
  }
);

// handle both http and https server logic
server.unifiedServer = (req, res) => {
  const method = req.method.toLowerCase();
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  // remove leading and trailing slash from path
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  // get query string object
  const queryString = parsedUrl.query;
  // get headers
  const headers = req.headers;
  // parse payload if exists
  const decoder = new stringDecoder('utf-8');
  let buf = '';
  req.on('data', data => (buf += decoder.write(data)));
  req.on('end', () => {
    buf += decoder.end();
    // route to specific handler. If not found, use 404 handler
    const chosenHandler =
      server.router[trimmed] != undefined
        ? server.router[trimmed]
        : server.router.notFound;
    const data = {
      trimmedPath: trimmed,
      queryString,
      method,
      headers,
      payload: helpers.parseJsonToObject(buf)
    };
    // route request to specified path
    chosenHandler(data, (status, payload) => {
      // use status code from callback, or use a default status code
      status = typeof status === 'number' ? status : 200;
      // use payload from callback, or use empty object
      payload =
        typeof payload === 'object'
          ? JSON.stringify(payload)
          : JSON.stringify({});
      // set headers
      res.setHeader('Content-Type', 'application/json');
      // write status code to response
      res.writeHead(status);
      // end response and attach payload
      res.end(payload);
    });
  });
};

// Define request router
server.router = {
  checks: handlers.checks,
  notFound: handlers.notFound,
  ping: handlers.ping,
  tokens: handlers.tokens,
  users: handlers.users
};

server.initialize = () => {
  // Start http server
  server.httpServer.listen(config.httpPort, () => {
    console.log('Server listening on http port ', config.httpPort);
  });
  // Start https server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log('Server listening on https port: ', config.httpsPort);
  });
  // Ensure directory structure exists
  _lib.initialize();
};

module.exports = server;
