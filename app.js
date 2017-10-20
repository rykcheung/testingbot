app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'DQVJ1VWhZAUEM1aWhOWXZAWSXFfVm5aOHZAwcE5EQ0VfZA3JZAcFhaR3NxZAGhzSDkyWGU0dlJzbVc2V3VUeWV0TXF5eFZAkb2hpX1YwOGxvZAThIMk9ydDdaTThnMVZAyN3pldmJ1dG0zUGthNnpPRDlKS2VyYWxfajJlaS1td05GbFFTdDZAxdXBMalFIb0piWmJHT2FDdHRnTUZAOZAUJ6ZA21NZA2FoM2pzaUNWRGROdy0tYTNjTkhnR2dzbTNjLVpsQjBXUTlndnRkWHU3ZAk1YcDdzUEd5cQZDZD') {
      res.send(req.query['hub.challenge']);
    } else {
      res.send('Error, wrong validation token');    
    }
  });
