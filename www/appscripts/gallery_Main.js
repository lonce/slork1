/* */

require.config({
	paths: {
		"jsaSound": (function(){
			if (! window.document.location.hostname){
				alert("This page cannot be run as a file, but must be served from a server (e.g. animatedsoundworks.com:8001, or localhost:8001)." );
			}
				// hardcoded to read sounds served from jsaSaddVectoround listening on port 8001 (on the same server as the AnticipatoryScore server is running)
				var host = "http://"+window.document.location.hostname + ":8001";
				//var host = "http://"+"172.23.68.214" + ":8001";
				//alert("Will look for sounds served from " + host);
				return (host );
			})()
	}
});
require(
	["require",  "../utils/soundSelect", "../utils/comm", "../utils/utils", "../utils/touch2Mouse",   "config", "personalConfig", "galleryDisplay",  "player_Gallery",  "polyfill"],

	function (require, soundSelect, commFactory, utils, touch2Mouse,   config, personalConfig, galleryDisplay, player) {


		var comm = commFactory(function(){
			console.log("OK, comms are ready .... lets go!");
			timerLoop();  // fire it up
		});

		player.loadSounds(function(){
					personalConfig.set("soundsLoaded");
				});


		personalConfig.report(function(){

			// unsubscribe to previous room, join new room
			if (myRoom != undefined) comm.sendJSONmsg("unsubscribe", [myRoom, "conductor"]);
    		myRoom  = personalConfig.room;
			if (myRoom != undefined) {
				console.log("personalConfig.report: joing a room named " + myRoom); 
				comm.sendJSONmsg("subscribe", [myRoom, "conductor"]);
				// Tell everybody in the room to restart their timers.
				comm.sendJSONmsg("startTime", []);
			} 
		});


        var myrequestAnimationFrame = utils.getRequestAnimationFrameFunc();

		var timeOrigin=performance.now();//Date.now();
		var serverTimeOrigin=0;
		var serverTime=0;
		var myID=0;
		var myRoom=undefined;


		var m_lastDisplayTick=0;
		var m_tickCount=0;
		var k_timeDisplayElm=window.document.getElementById("timeDisplayDiv");

		var gd = galleryDisplay(document.getElementById("svg_area"), player);



		//--------------------------------------------------------------------
		// CONTROLLERS
		var controlManual = window.document.getElementById("control.manual");
		var controlAutomatic = window.document.getElementById("control.automatic");
		controlManual.checked=true; // default

		var gainSlider=window.document.getElementById("gainID");
		gainSlider.addEventListener('input', function(){
			console.log("gain value = " + parseFloat(gainSlider.value));

			comm.sendJSONmsg("setGain", [parseFloat(gainSlider.value)/10, 0]);

			});

		var densitySlider=window.document.getElementById("densityID");
		densitySlider.addEventListener('input', function(){
			console.log("density value = " + parseFloat(densitySlider.value));

			comm.sendJSONmsg("setDensity", [parseFloat(densitySlider.value)/10, 0]);

			});

		var allOffButt=window.document.getElementById("allOffButt");
		allOffButt.addEventListener("click", function(){
			comm.sendJSONmsg("allOff", []);
		});

		// secret keyboard shortcuts to play as agent (Ctl-Shift-A, or as human Ctl-Shift-H)
		window.addEventListener("keydown", keyDown, true);
		function keyDown(e){
         		//var keyCode = e.keyCode;

         		var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
         		console.log("char code is " + charCode);
         		switch(charCode){

         			case 72: // h
         				if ((e.ctrlKey)&&(e.shiftKey)){
         					//alert("control s was pressed");

         				}
         				break;
     				case 65: //a
         				if ((e.ctrlKey)&&(e.shiftKey)){

         				}
         				break;
				}
		}

		//---------------------------------------------------------------------------
		// init is called just after a client navigates to the web page
		// 	data[0] is the client number we are assigned by the server.
		comm.registerCallback('init', function(data) {
			//pong.call(this, data[1]);
			myID=data[0];
			console.log("Server acknowledged, assigned me this.id = " + myID);
			personalConfig.set("serverAck");
			//personalConfig.set("soundsLoaded");



		});
		//---------------------------------------------------------------------------
		// data is [timestamp (relative to "now"), x,y] of contGesture, and src is the id of the clicking client

		//---------------------------------------------------------------------------
		comm.registerCallback('metroPulse', function(data, src) {
			serverTime=data;
			// check server elapsed time again client elapsed time
			//console.log("on metropulse, server elapsed time = " + (serverTime-serverTimeOrigin) +  ", and client elapsed = "+ (Date.now() - timeOrigin ));
		});
		//---------------------------------------------------------------------------
		comm.registerCallback('startTime', function(data) {
			console.log("server startTime = " + data[0] );


				
			timeOrigin=performance.now();//Date.now();
			serverTimeOrigin=data[0];
			m_lastDisplayTick=0;

		});
		//---------------------------------------------------------------------------
		// Just make a color for displaying future events from the client with the src ID
		comm.registerCallback('newmember', function(data, src) {
			console.log("new member : " + src);
		});
		//---------------------------------------------------------------------------
		// newRole message when participants join or leave
		comm.registerCallback('newRole', function(data, src) {
			console.log("new role : " + data[0] + " of " + data[1]);
			// display number of participants
			document.getElementById('participants').value=data[1];
		});
		//---------------------------------------------------------------------------
		// called when you join with a list of other member IDs. src is meaningless since it is this client
		comm.registerCallback('roommembers', function(data, src) {
			if (data.length > 1) 
					console.log("there are other members in this room!");
			for(var i=0; i<data.length;i++){
				if (data[i] != myID){
					console.log("room member IDs: " + data[i]);
				}
			}
		});

		//-------------------------------------------------------------------------------------
		comm.registerCallback('play', function(data, src) {
				gd.addVector(src, data[0], data[1], data[2]);
				console.log('PLAY!!!')
		});

		comm.registerCallback('release', function(data, src) {
				gd.removeVector(src);
		});

		comm.registerCallback('rateChange', function(data, src) {
				gd.rateChange(src, data[0]);
		});

		comm.registerCallback('devicePitch', function(data, src) {
				gd.devicePitch(src, data[0]);
		});

		comm.registerCallback('colorID', function(data, src) {
				if (data.length > 0){
					gd.setColor(src, data[0]);
				}
		});
		comm.registerCallback('unsubscribe', function(data, src) {
					gd.rmColor(src);
		});

		var lastDrawTime=0;
		var t_sinceOrigin;
		var nowishP = function(t){
			if ((t > lastDrawTime) && (t <= t_sinceOrigin)) return true;
		}


		// Record the time of the mouse event on the scrolling score
		function onMouseDown(e){
		}

		function onMouseUp(e){
		}

		function onMouseMove(e){
		}

		//+_++++++++++++++++++++++++++++++



		//	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		var t_myMachineTime;
		var t_count=0;
		var timerLoop = function(hrts){  // DOMHighResTimeStamp

			t_myMachineTime = performance.now();// Date.now();
			//t_myMachineTime = hrts;
			t_sinceOrigin = t_myMachineTime-timeOrigin;

			gd.tick(t_myMachineTime);

			// create a display clock tick every 1000 ms
			while ((t_sinceOrigin-m_lastDisplayTick)>1000){  // can tick more than once if computer went to sleep for a while...
				

				m_tickCount++;
				k_timeDisplayElm.innerHTML=Math.floor(m_lastDisplayTick/1000);
				m_lastDisplayTick += 1000;

			}

			myrequestAnimationFrame(timerLoop);
			//setTimeout(timerLoop, 1000);

		};


		// INITIALIZATIONS --------------------

	}
);