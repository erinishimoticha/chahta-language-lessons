"use strict";

/**
 * Web server
 */

var express = require('express');
var morgan = require('morgan');

var app = express();
var port = process.env.PORT || 8080;

app.use(morgan('combined'));

/**
 * Return the lessons we saved from choctawschools.com.
 */
app.get("/lessons", function (req, res) {
    var lessons;
    try {
        lessons = require("./pageinfo.json");
        res.json(Object.keys(lessons).map(function values(key) {
            return lessons[key];
        }));
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.use(express.static(__dirname + '/static'));

app.listen(port, function () {
    console.log("Listening on port " + port);
});

