const express = require('express')
const app = express()

const fs = require('fs-extra');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/data', function (req, res) {
  fs.readFile("./data/data.json", (err, data) => {
      res.send(data.toString());
  });
})

app.post('/data', (req, res) => {
    fs.readFile("./data/data.json", (err, data) => {
        let jsonData = JSON.parse(data.toString());
        jsonData.results.push(JSON.parse(req.body));
        fs.writeFile("./data/data.json", JSON.stringify(jsonData));
        res.send("success");
    });
});

app.post('/reset',  (req, res) => {
    reset();
    res.send("success");
});

app.listen(3000, function () {
    reset();
    console.log('Example app listening on port 3000!')
})

function reset() {
    fs.copySync("./data/data_original.json", "./data/data.json", {
        overwrite: true
    });
}