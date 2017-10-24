'use strict';

const
  crypto = require('crypto'),
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request');

const
  VERIFY_TOKEN = 'TOKEN',
  ACCESS_TOKEN = 'DQVJ1VWhZAUEM1aWhOWXZAWSXFfVm5aOHZAwcE5EQ0VfZA3JZAcFhaR3NxZAGhzSDkyWGU0dlJzbVc2V3VUeWV0TXF5eFZAkb2hpX1YwOGxvZAThIMk9ydDdaTThnMVZAyN3pldmJ1dG0zUGthNnpPRDlKS2VyYWxfajJlaS1td05GbFFTdDZAxdXBMalFIb0piWmJHT2FDdHRnTUZAOZAUJ6ZA21NZA2FoM2pzaUNWRGROdy0tYTNjTkhnR2dzbTNjLVpsQjBXUTlndnRkWHU3ZAk1YcDdzUEd5cQZDZD',
  APP_SECRET = 'c5ce9b6085019895cc49350579891689';

var graphapi = request.defaults({
  baseUrl: 'https://graph.facebook.com',
  json: true,
  auth: {
    'bearer' : ACCESS_TOKEN
  }
});

function verifyRequestSignature(req, res, buf) {
  var signature = req.headers['x-hub-signature'];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an error.
    console.error('Couldn\'t validate the signature.');
  } else {
    var elements = signature.split('=');
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
    .update(buf)
    .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error('Couldn\'t validate the request signature.');
    }
  }
}


var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');


app.get('/', function(req, res) {
  const { headers, method, url } = req;
  let body = [];
  
  req.on('error', function(err) {
    console.error(err);
  }).on('data', function(chunk) {
    body.push(chunk);
  }).on('end', function() {
    body = Buffer.concat(body).toString();

    res.writeHead(200, {
      'Context-Type': 'text/html'
    });
    res.end('<html><body><h1>Hello, world</h1></body></html>');
  });
}).listen(process.env.PORT || 80 || 443, process.env.hostname || 'localhost');


// Handle the webhook subscription request from Facebook
app.get('/webhook', function(req, res) {

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.status(403).send('Invalid token');
    }
  }
});


// Creates the endpoint for our webhook 
app.post('/webhook', function(req, res) {  

  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      if(entry.field === 'mention') {
        let mention_id = (entry.value.item === 'comment') ? entry.value.comment_id : entry.value.post_id;

        // Like the post or comment to indicate acknowledgement
        graphapi({
          url: '/' + memtion_id + '/likes',
          method: 'POST'
        }, function(error, res, body) {
          console.log('Like', mention_id);
        });
        let message = entry.value.message,
          message_tags = entry.value.message_tags,
          sender = entry.value.sender_id,
          permalink_url = entry.value.permalink_url,
          recipients = [],
          managers = [],
          query_inserts = [];
        
        message_tags.forEach(function(message_tag) {
          // Ignore page / group mentions
          if(message_tag.type !== 'user')
            return;
          // Add the recipient to a list, for later retrieving their manager
          recipients.push(message_tag.id);
        })
      }

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      //let webhookEvent = entry.messaging[0];
      //console.log(webhookEvent);
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.status(404).send('Something wrong');
  }
});

