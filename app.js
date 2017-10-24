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

var GRAPH_API_BASE = 'https://graph.facebook.com';

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


// Greate the app server
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

  try {
    let body = req.body;

    switch(body.object) {
      case 'page':
        processPageEvents(body);
        break;
      case 'group':
        break;
      case 'user':
        break;
      case 'workplace_security':
        break;
      default:
        console.log('Unhandled webhook object', body.object);
    }
  } catch (e) {
    console.error(e);
  } finally {
    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  }
});



function processPageEvents(body) {
  
  // Iterates over each entry - there may be multiple if batched
  body.entry.forEach(function(entry) {
    
    let page_id = entry.id;

    // Chat messages sent to the page
    if(entry.messaging) {

      entry.messaging.forEach(function(messaging_event) {

        console.log(messaging_event);

        request({
          baseUrl: GRAPH_API_BASE,
          url: '/me/messages',
          method: 'POST',
          qs: {
            'recipient': {
              'ids': [messaging_event.sender.id]
            },
            'message': {
              'text': 'Got it!'
            },
            'fields': 'first_name'
          },
          auth: {
            'bearer': ACCESS_TOKEN
          }
        }, function(error, response, body) {
          console.log(error, body);

          body = JSON.parse(body);
          var messageData = {
            recipient: {
              id: body.id
            },
            message: {
              text: `Hi ${body.first_name}, your opinion matters to us. Do you have a few seconds to answer a quick survey?`,
              quick_replies: [{
                content_type: 'text',
                title: 'Yes',
                payload: 'START_SURVEY'
              },{
                content_type: 'text',
                title: 'Not now',
                payload: 'DELAY_SURVEY'
              }]
            }
          };
      
          callSendAPI(messageData);
        });

      });
    }
/*
    // Page related changes, or mentions of the page
    if(entry.changes) {
      entry.changes.forEach(function(change) {
        console.log('Page Change', page_id, change);
      });
    }

    if(entry.field === 'mention') {
      let mention_id = (entry.value.item === 'comment') ? entry.value.comment_id : entry.value.post_id;

      // Like the post or comment to indicate acknowledgement
      graphapi({
        url: '/' + memtion_id + '/likes',
        method: 'POST'
      }, function(error, res, body) {
        console.log('Like', mention_id);
      });
    }
*/

  });
}



/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  console.log('Message Body');
  console.log(messageData);

	request({
    baseUrl: GRAPH_API_BASE,
    url: '/me/messages',
    qs: {
      access_token: ACCESS_TOKEN
    },
		method: 'POST',
		json: messageData
	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;

			if (messageId) {
				console.log('Successfully sent message with id %s to recipient %s', messageId, recipientId);
			} else {
				console.log('Successfully called Send API for recipient %s', recipientId);
			}
		} else {
			console.error('Failed calling Send API', response.statusCode, response.statusMessage, body.error);
		}
	});  
}

