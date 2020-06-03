var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql= require('mysql');
var myConnection = require('express-myconnection');
var bodyParser = require('body-parser');

var config = require('./bin/db');
var dbOption={
    host:config.database.host,
    user:config.database.user,
    password: config.database.password,
    port:config.database.port,
    database:config.database.db
};


var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(myConnection(mysql,dbOption,'pool'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);

module.exports = app;
