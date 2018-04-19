// ------------------------------  OPEN-AUTOMATION ----------------------------------- //
// -----------------  https://github.com/physiii/Dash_Relay_Index  -------------------- //
// ----------------------------- physiphile@gmail.com -------------------------------- //


// ----------------------------------------------------- //
// import config or create new config.json with defaults //
// ----------------------------------------------------- //
var TAG = "[Dash_Relay_Index.js] ";
var socket = require('./socket.js');
var https = require('https');
var http = require('http');
var fs = require('fs');
var configure = require('./config.js');
var config = require('./config.json');
var express = require('express');
var app = express();


var use_ssl = config.use_ssl || false;
var use_dev = config.use_dev || false;

/*
if(use_dev == true){
var privateKey = fs.readFileSync('./key.pem');
var certificate = fs.readFileSync('./cert.pem');
var credentials = { key: privateKey, cert: certificate };
} else {
var privateKey = fs.readFileSync('/etc/letsencrypt/live/pyfi.org/privkey.pem');
var certificate = fs.readFileSync('/etc/letsencrypt/live/pyfi.org/fullchain.pem');
var credentials = { key: privateKey, cert: certificate };
*/

if (use_ssl) {
  var secure_server = https.createServer(credentials, app).listen(config.relay_secure_port);
  console.log('Secure Server listening on port ' + config.relay_secure_port);
} else {
  var server = http.createServer(app).listen(config.relay_port);
  console.log(TAG,'Insecure Server listening on port ' + config.relay_port);
}

if (use_ssl){
  socket.start(secure_server);
  console.log(TAG, "Socket created on secure server")
} else {
  socket.start(server);
  console.log(TAG, "Socket created on server")
}
