/* Another simple server, this one responds to requests by providing html files */

// require is a built-in node function for importing libraries  
// import the 'express' framework for creating servers 
var express = require("express");
var app = express();

var k_portnum;

// 'process' is an object built in to node.js
// process.argv is an array of the elements used on the command line to start this node process
// Check for proper usage and set desired port number using node-defined 'process' object
if (process.argv.length < 3){
    console.log("usage: node myserver portnum");
    process.exit(1);
}
k_portnum=process.argv[2];

//****************************************************************************
// Create route (or path) to address files we want to serve
var m_useRoot="/www";
app.use(express.static(__dirname + m_useRoot));

/* listen, call function when port is open */
var server = app.listen(k_portnum, function() {
    console.log('Listening on port %d', server.address().port);
});

