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

    response.writeHead(200, {
      'Context-Type': 'text/html'
    });
    response.end('<html><body><h1>Hello, world</h1></body></html>');
  });
}).listen(process.env.PORT || 80 || 443);

