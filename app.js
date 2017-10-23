var http = require('http');

http.createServer( function(request, response) {
  const { headers, method, url } = request;
  let body = [];
  
  request.on('error', function(err) {
    console.error(err);
  }).on('data', function(chunk) {
    body.push(chunk);
  }).on('end', function() {
    body = Buffer.concat(body).toString();

    // for Facebook Messa
    if (request.query['hub.verify_token'] === 'TOKEN') {
      console.log("Validating webhook");
      response.statusCode(200).send(request.query['hub.challenge']);
    } else {
      console.error("Failed validation.");
      response.statusCode(403).send('Error, wrong validation token');    
    }

    response.writeHead(200, {
      'Context-Type': 'text/html'
    });
    response.end('<html><body><h1>Hello, world</h1></body></html>');
  });
}).listen(process.env.PORT || 80);

