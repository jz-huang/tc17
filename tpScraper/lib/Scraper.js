"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
function GetAuthorProfile(authorId) {
    var options = {
        host: "public.tableau.com",
        path: "/profile/api/" + authorId
    };
    var req = http.request(options, function (res) {
        console.log("STATUS: " + res.statusCode);
        console.log("HEADERS: " + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log("BODY: " + chunk);
        });
        res.on('end', function () {
            console.log('No more data in response.');
        });
    });
    req.end();
}
function GetAuthorTableSchema() {
    return "author,id,followerCount,";
}
GetAuthorProfile('sandy.wang');
