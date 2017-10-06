const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');

app.use(bodyParser.json());
app.use(express.static('public'));

app.post("/pdf", (req, res) => {
    var options = {
        url: req.body.url,
        encoding: null
      };
    request(options).pipe(res);
});

app.listen(8000, function () {
    console.log('Example app listening on port 8000!')
});