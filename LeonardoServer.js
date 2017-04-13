// The server only needs to register for msgs it needs to intercept
// Otherwise, msgs between clients just get passed right through. 

var express = require("express")
, app = express()
, server = require('http').createServer(app)
, WebSocketServer = require('ws').Server
, wss = new WebSocketServer({server: server})
, fs = require('fs');

//-------------------------------------------------------------
var k_portnum = 7000+Math.floor(2000*Math.random());
console.log("messageServer is starting with command line arguments:");
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});
if (process.argv.length < 3){
    console.log("Since you didn't specify a port number, we'll use: " + k_portnum)
    console.log("To specify portnumber, use: node myserver portnum");
    //process.exit(1);
}
var k_portnum = process.argv[2] || k_portnum;
//--------------------------------------------------------------
console.log("Hello from diffusion server 1");

var id = 1; // Given out incrementally to room joining clients
// Room list, each with an array of members (socket connections made by clients)
var rooms = {'': []};
var roomOwner = [];
var personalMembers = [];

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// message handling - functions.called to pass in 'this' (socket) contexts
var callbacks = {};
function registerCallback(name, callback) {
    callbacks[name] = callback;
    //console.log("callbacks["+name+"]="+callback);
}

// messages this server handles from clients
registerCallback('subscribe', subscribe);
registerCallback('unsubscribe', unsubscribe);
registerCallback('contGesture', contGesture);
registerCallback('beginGesture', beginGesture);
registerCallback('endGesture', endGesture);
registerCallback('startTime', startTime);
//registerCallback('mvtPhase', mvtPhase);

// Note: for all functions used as callbacks, "this" will be a socket passed to the .call()
function subscribe(data) {
    //console.log("SUBSCRIBE");
    var rm=data[0];
    console.log("subscribe " + data[0]);
    if (data.length > 1){
        //console.log("subscribe roleType" + data[1]);
        this.roleType=data[1];
    } else{
        this.roleType="personal"; // the default
    }

    this.room = rm;
    if (rooms[rm] === undefined){
        console.log("creating rm " + rm);
        rooms[rm] = [this];
        roomOwner[rm]=this.id;
        personalMembers[rm]=0;
    }
    else {
        rooms[rm].push(this);
    }
    if (this.roleType==="personal"){
        personalMembers[rm]++;
    }


    console.log("subscribe at time "+ Date.now() +": personalMembers[" + rm + "] = " + personalMembers[rm]);


    //console.log("subscribe: room = " + rm + ", and the room now has " + rooms[rm].length + " members.");
    roomBroadcast(this.room, this, 'newmember', [this.id]);
    newRoles(rm);
    //console.log("new subscription to room " + rm);

    /*
     sendJSONmsg(this, 'roommembers', (function(){
        var rmids=[];
        for(var i=0;i<rooms[rm].length;i++){
            rmids.push(rooms[rm][i].id);
        }
        return rmids;
    }()));
     */

}


function unsubscribe(rm) {
    var ws = this;
    //console.log("unsubscribe from room = " + rm);
    if ((rm != '') && (rm != undefined) && (rooms[rm] != undefined)){
        console.log("Unsubscribe at time="  + Date.now() + ",  with " + rooms[rm].length + " members");

        if (ws.roleType==="personal"){
            //console.log("unsubscribe (a) : personalMembers[" + rm + "] = " + personalMembers[rm]);
            personalMembers[rm]--;
            console.log("unsubscribe (b): personalMembers[" + rm + "] = " + personalMembers[rm]);
        }

        //console.log("before filtering, rooms ["+rm+"] is " + rooms[rm]);
        rooms[rm] = rooms[rm].filter(function (s) {return s !== ws;});



        if ((rooms[rm] != undefined) && (rooms[rm].length===0)){ // if nobody is in the room
            console.log("deleting room " + rm);
            delete rooms[rm];
            delete roomOwner[rm];
        }
        room = '';

        console.log(ws.id + " is gone..." );
        //console.log("about to call newRoles, room["+rm+"] is " + rooms[rm]);
        //console.log("and, personalMembers[" + rm + "] = " + personalMembers[rm]);
        roomBroadcast(this.room, this, 'unsubscribe', [this.id]);
        newRoles(rm);

    }
}



// basic data exchange method for responding to one socket, sending to rest
function contGesture(data) {
    roomBroadcast(this.room, this, 'contGesture', data);
}

// basic data exchange method for responding to one socket, sending to rest
function beginGesture(data) {
    roomBroadcast(this.room, this, 'beginGesture', data);
}


// basic data exchange method for responding to one socket, sending to rest
function endGesture(data) {
    roomBroadcast(this.room, this, 'endGesture', data);
}

// When 'ere a client sends this message, the server sends out a new time to all room members
function startTime() {
    var JStime = Date.now();
    roomBroadcast(this.room, 0, 'startTime', [JStime]); // 0 sender sends to all members in a room
}

/*
function mvtPhase(data) {
    var JStime = Date.now();
    roomBroadcast(this.room, this, 'mvtPhase', data); // 0 sender sends to all members in a room
}
*/

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function genericBroadcast(m, data) {
    //console.log("generic message will broadcast " + m + " with data " + data + " to all others in this room")
    roomBroadcast(this.room, this, m, data);
}
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function roomBroadcast(room, sender, name, data) {
    //console.log("room " + room + ", sender " + sender + ", message " + name + ", data " + data);
    if (rooms[room] === undefined)
        return;

    var src = sender ? sender.id : 0;
    //if (sender !== null) console.log(name, 'from', src);
    rooms[room].forEach(function (ws) {
        if (ws !== sender) {
            if (ws.readyState === 1){
                //console.log( "roomBroadcast: ws" + ws + " with ws.id =" + ws.id );
                sendJSONmsg(ws, name, data, src);
            } else {
                console.log( "roomBroadcast: ws" + ws + " with ws.id =" + ws.id + " is not in ready state");
            }
        }
    });
}

// newRoles is a message sent by the server (not by any client) when new clients enter or leave
// the data = [rolenum, numMembers]
function newRoles(room){
    if (rooms[room] === undefined)
        return;

    var role=1;
    var len=personalMembers[room];
    //console.log("room " + room + " now has " + len + " personal members");
    rooms[room].forEach(function (ws) {
        if (ws.readyState === 1){
            if (ws.roleType === "personal"){ // other types ("conductor" and "gallery" don't get new roles)
                sendJSONmsg(ws, 'newRole', [role++, len], roomOwner[room]);
            } else {  // but the conductor and the gallery still want to know how many personals are in the room
                sendJSONmsg(ws, 'newRole', [0, len], roomOwner[room]);
            }
        } else {
            console.log( "newRoles: ws" + ws + " with ws.id =" + ws.id + " is not in ready state");
        }

    });
}


function sendJSONmsg(ws, name, data, source) {
    ws.send(JSON.stringify({n: name, d: data, s:source}));
}

/*
function receiveJSONmsg(data, flags) {
    var obj;
    try {
        obj = JSON.parse(data);
    } catch (e) {
        return;
    }
    
    if (!obj.hasOwnProperty('d') || !obj.hasOwnProperty('n') || callbacks[obj.n] === undefined)
        return;
    //console.log("object.d: " + object.d + ", object.n:"+ object.n);

    callbacks[obj.n].call(this, obj.d);
}
*/

function receiveJSONmsg(data, flags) {
    //console.log("RECEIVE");
    var obj;
    try {
        obj = JSON.parse(data);
    } catch (e) {
        return;
    }
        //console.log("receiveJSONmsg! data = " + obj);

    if (!obj.hasOwnProperty('d') || !obj.hasOwnProperty('n'))
        return;

    if (callbacks[obj.n]){
        //console.log("call registered callback object.d: " + obj.d + ", object.n:"+ obj.n);
        callbacks[obj.n].call(this, obj.d);
    } else {
        //console.log("call generic callback object.d: " + obj.d + ", object.n:"+ obj.n);
        genericBroadcast.call(this, obj.n, obj.d);
    }
}

//****************************************************************************
// Server activity code (other than it's simple message-relay duties)

// Sends a pulse to all members of all rooms at the pulsePeriod
var pulsePeriod=1000;
function emitPulse() {
    var JStime = Date.now();
    var rm;
    for (rm in rooms){
        rooms[rm].forEach(function (ws) {

            if (ws.readyState === 1){
                sendJSONmsg(ws, 'metroPulse', [JStime], 0);
            } else {
                console.log( "pulse: ws" + ws + " with ws.id =" + ws.id + " is not in ready state");
            }
            
        });
    }
}
setInterval(emitPulse, pulsePeriod);


//****************************************************************************
app.use(express.static(__dirname + "/www"));
server.listen(k_portnum);
console.log("Connected and listening on port " + k_portnum);

wss.on('connection', function (ws) {
    ws.id = id++;
    console.log("got a connection at time " + Date.now() + ", assigning ID = " + ws.id);
    ws.on('message', receiveJSONmsg.bind(ws));
    ws.room = '';
    sendJSONmsg(ws, 'init', [ws.id, Date.now()]);
    //sendRooms.call(ws);

    ws.on('close', function() {        
        callbacks['unsubscribe'].call(ws, ws.room);
    });
});

function getRoomList(){
    rlist=[];
    for (r in rooms){
        if (r==='') continue;
        if(rooms.hasOwnProperty(r)){
            rlist.push(r);
        }
    }
    console.log("getRoomList: " + rlist);
    return rlist;
}

app.get(["/RoomList"],function(req, res){
  var jsonObj;
  var jsonList=[];
  console.log("fetching roomlist");
  res.send({"jsonItems":   getRoomList()  }); // returns an array of room names
});

exports.server = server;

