/**
 * This is the entry point, and will spin up our server
 */

// Deps
const config = require('./config');
const http = require('http');
const url = require('url');
// for payloads
const stringDecoder = require('string_decoder').StringDecoder;

// Server should response to GET, POST, PUT, DELTE, HEAD
const server = http.createServer((req, res) => {
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
      handlers[trimmed] != undefined ? handlers[trimmed] : handlers.notFound;
    const data = {
      trimmedPath: trimmed,
      queryString,
      method,
      headers,
      payload: buf
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
      console.log('Returning response: ', status, payload);
    });
  });
});

// Start server, listen on port 3000
server.listen(config.port, () => {
  console.log('Server listening on port ', config.port);
});

// Define request handlers
const handlers = {
  sample: (data, callback) => {
    // Callback an http status code and payload object
    callback(406, { name: 'sample-handler' });
  },
  notFound: (data, callback) => {
    callback(404);
  }
};

// Define request router
const router = {
  sample: handlers.sample
};
