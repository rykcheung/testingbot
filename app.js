const http = require('http');

http.createServer((req, res) => {
  const { headers, method, url } = request;
  let body = [];
  request.on('error', (err) => {
    console.error(err);
  }).on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();

    // for Facebook Messa
    if (req.query['hub.verify_token'] === 'TOKEN') {
      res.statusCode(200).send(req.query['hub.challenge']);
    } else {
      res.statusCode(403).send('Error, wrong validation token');    
    }

  });
}).listen(80);

/*
server.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'TOKEN') {
      res.send(req.query['hub.challenge']);
    } else {
      res.send('Error, wrong validation token');    
    }
  });
*/