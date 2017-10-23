const http = require('http');

http.createServer((request, response) => {
  const { headers, method, url } = request;
  let body = [];
  request.on('error', (err) => {
    console.error(err);
  }).on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();

    // for Facebook Messa
    /*
    if (request.query['hub.verify_token'] === 'TOKEN') {
      response.statusCode(200).send(request.query['hub.challenge']);
    } else {
      response.statusCode(403).send('Error, wrong validation token');    
    }
    */

    response.writeHead(200, {
        'Context-Type': 'text/html'
    });
    response.end('<html><body><h1>Hello, world</h1></body></html>');
  });
}).listen(80);

