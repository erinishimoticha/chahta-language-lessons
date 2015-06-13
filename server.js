"use strict";

/**
 * Web server
 */

var express = require('express');
var checker = require('./checker');

setInterval(function () {
    checker.check();
}, 24 * 60 * 60 * 1000);

var app = express();
var port = process.env.PORT || 8080;

app.use(express.static(__dirname + '/static'));
app.listen(port, function () {
    console.log("Listening on port " + port);
});

