'use strict';

const
  crypto = require('crypto'),
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request');

const
  VERIFY_TOKEN = 'TOKEN',
  ACCESS_TOKEN = 'DQVJ1VWhZAUEM1aWhOWXZAWSXFfVm5aOHZAwcE5EQ0VfZA3JZAcFhaR3NxZAGhzSDkyWGU0dlJzbVc2V3VUeWV0TXF5eFZAkb2hpX1YwOGxvZAThIMk9ydDdaTThnMVZAyN3pldmJ1dG0zUGthNnpPRDlKS2VyYWxfajJlaS1td05GbFFTdDZAxdXBMalFIb0piWmJHT2FDdHRnTUZAOZAUJ6ZA21NZA2FoM2pzaUNWRGROdy0tYTNjTkhnR2dzbTNjLVpsQjBXUTlndnRkWHU3ZAk1YcDdzUEd5cQZDZD',
  APP_SECRET = 'c5ce9b6085019895cc49350579891689',
  WIT_AI_TOKEN = 'Y3CNOCK2WWG6PJEKXYW7PY6PBWYQXWE4';

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


// Enabling built-in NLP with Wit.ai
request({
  baseUrl: GRAPH_API_BASE,
  url: '/me/nlp_configs',
  method: 'POST',
  qs: {
    'nlp_enabled': true,
    'custom_token': WIT_AI_TOKEN
  },
  auth: {
    'bearer': ACCESS_TOKEN
  }
}, function(error, response, body) {
  if(error) {
    console.log(error, body);
  }
});


// Greate the app server to test the avalibility
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
    console.log('Error captured in the POST');
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

        //console.log(messaging_event);

        if(messaging_event.message) {
          var nlp_entities = messaging_event.message.nlp.entities;
          console.log(nlp_entities);

          // Set the default message
          var return_msg = 'Ok, I received your message: ' + messaging_event.message.text + ' but not understand, sorry!';

          if(nlp_entities.greetings) {
            return_msg = 'Hi there!';
          } else if(nlp_entities.intent) {
            nlp_entities.intent.forEach(function(intent) {

              // if the confidence level of the intent is low then return the default message
              if(intent.confidence > 0.95) {
                switch(intent.value) {
                  case 'order':
                    return_msg = 'Do you want to order';
                    if(nlp_entities.search_query) {
                      nlp_entities.search_query.forEach(function(query) {
                        return_msg += ' ' + query.value;
                      });
                      return_msg += '?';
                    } else {
                      return_msg += ' something?';
                    }
                    break;
                  case 'apply_leave':
                    return_msg = 'Do you want to apply for a';
                    if(nlp_entities.search_query) {
                      nlp_entities.search_query.forEach(function(query) {
                        return_msg += ' ' + query.value;
                      });
                    } else {
                      return_msg += ' leave';
                    }
                    if(nlp_entities.datetime) {
                      nlp_entities.datetime.forEach(function(dt){
                        return_msg += ' on ' + dt.value;
                      });
                    }
                    return_msg += '?';
                    break;
                  default:
                }
              }
            });
          }

          request({
            baseUrl: GRAPH_API_BASE,
            url: '/me/messages',
            method: 'POST',
            qs: {
              'recipient': {
                'ids': [messaging_event.sender.id]
              },
              'message': {
                'text': return_msg
              }
            },
            auth: {
              'bearer': ACCESS_TOKEN
            }
          }, function(error, response, body) {
            if(error) {
              console.log(error, body);
            } else {
              //console.log(messaging_event);
            }
            //console.log(error, body);
          });
        } else if(messaging_event.read) {
          console.log('Read message');
        } else {
          console.log('Unknown messaging');
        }
      });
    }
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

