var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// here we are using the .env file to configure our enviroment
require('dotenv').config();



var index = require('./routes/index');
var authorize = require('./routes/authorize');
var mail = require('./routes/mail');
var database = require('./helpers/database');
var reportSaver = require('./routes/reportSaver');
// var reports = require('./views/reports');

// Creating report object from database.js
testReport = require('./helpers/report_Schema');

var app = express();


// view engine setup
// we also set the path to where to find the views folder
app.set('views', path.join(__dirname, 'views'));
// here we are setting the type of view engine we are using which is hbs
app.set('view engine', 'hbs');

// default logger to display erros
app.use(logger('dev'));
// Returns middleware that only parses json and only looks at requests where the 
// Parses JSON between fron and back 
app.use(bodyParser.json());

//parsing the URL-encoded data with the querystring library (when false) 
app.use(bodyParser.urlencoded({
  extended: false
}));

// middleware to allow access to cookies
app.use(cookieParser());

// use any static files in the public direcotry
app.use(express.static(path.join(__dirname, 'public')));

// set the root route to show the index.js
app.use('/', index);

// set authorize route
app.use('/authorize', authorize);

// set mail route
app.use('/mail', mail);

// app.use('/mail/saveReport', mail)

app.use('/reportSaver', reportSaver)

app.use('/database', database);

// app.use('/reports', reports)




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;