const http = require('http');

const hostname = 'hkstp-testing-bot.azurewebsites.net';
const port = 80;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('content-type', 'text/plain');
    res.end('Hello world\n');
});

server.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'TOKEN') {
      res.send(req.query['hub.challenge']);
    } else {
      res.send('Error, wrong validation token');    
    }
  });
