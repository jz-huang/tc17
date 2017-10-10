const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');

app.use(bodyParser.json());
app.use(express.static('public'));

app.listen(8000, function () {
    console.log('App listening on port 8000!')
});