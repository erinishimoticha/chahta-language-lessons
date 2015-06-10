"use strict";

/**
 * Web server
 */

var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var passport = require('passport');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var serverConfig = require('./config/server');

require('./config/passport')(passport);

app.use(cookieParser());
app.use(bodyParser());

app.set('view engine', 'ejs');

app.use(session({
    secret: serverConfig.sessionSecret
}));

app.use(passport.initialize());
app.use(passport.session());

require('./app/routes.js')(app, passport);

app.listen(port);
console.log('listenining at http://localhost:' + port);
