/* */

require.config({
	paths: {
		"jsaSound": (function(){
			if (! window.document.location.hostname){
				alert("This page cannot be run as a file, but must be served from a server (e.g. animatedsoundworks.com:8001, or localhost:8001)." );
			}
				// hardcoded to read sounds served from jsaSound listening on port 8001 (on the same server as the AnticipatoryScore server is running)
				var host = "http://"+window.document.location.hostname + ":8001";
				//var host = "http://"+"172.23.68.214" + ":8001";
				//alert("Will look for sounds served from " + host);
				return (host );
			})()
	}
});
require(
	["require",  "../utils/soundSelect", "../utils/comm", "../utils/utils", "../utils/touch2Mouse",  "agentPlayer", "config", "publicConfig", "galleryDisplay",  "polyfill"],

	function (require, soundSelect, commFactory, utils, touch2Mouse,  agentPlayer, config, publicConfig, galleryDisplay) {

		var m_agent;
		var comm = commFactory(function(){
			console.log("OK, comms are ready .... lets go!");

			if (controlAutomatic.checked===true){
				state.setState(0);
			}

			
			timerLoop();  // fire it up
		});

		publicConfig.report(function(){
			if (publicConfig.player === "agent"){
				console.log("you will play with (or as) an agent");
				m_agent=agentPlayer();
			} else {
				console.log("you are playing as a human");
			}

			// unsubscribe to previous room, join new room
			if (myRoom != undefined) comm.sendJSONmsg("unsubscribe", [myRoom, "conductor"]);
    		myRoom  = publicConfig.room;
			if (myRoom != undefined) {
				console.log("publicConfig.report: joing a room named " + myRoom); 
				comm.sendJSONmsg("subscribe", [myRoom, "conductor"]);
				// Tell everybody in the room to restart their timers.
				comm.sendJSONmsg("startTime", []);
			} 
		});

		var state = {
			"currentState": 0,
			"currentPhase": 0,
			"lastStateChangeTime": -999999999999,
			"k_numStates": 6,
			"ages": [6,6,6,6,6,6], // since last played
			"k_stateDurMS": 60000,
			"setState": function(snum){
				state.currentState=snum;
				state.currentPhase=0;
				state.lastStateChangeTime=performance.now();
				gd.setState(snum);

				comm.sendJSONmsg("mvtPhase", [snum, state.k_stateDurMS]);
				console.log("setState = " + state.currentState + " at time = " + state.lastStateChangeTime);
			},

			"update": function(t){
				state.currentPhase=(t-state.lastStateChangeTime)/state.k_stateDurMS;
				//console.log("(t -laststattime)/numstates =  (" + t + " - " + state.lastStateChangeTime + ")/"+ state.k_stateDurMS + " = " + state.currentPhase);
				if (controlAutomatic.checked===true){
					if (state.currentPhase >= 1){
						console.log("set a new state ");
						// randomly choose a state other than the current
						//state.setState( Math.floor((state.currentState + 1+(state.k_numStates-1)*Math.random())%state.k_numStates));
						state.setState( (function(){
							var newstate = Math.floor((state.k_numStates)*Math.random());
							while(state.ages[newstate] < 4){
								newstate = Math.floor((state.k_numStates)*Math.random());
							}
							for (var i=0;i<state.k_numStates;i++){
								state.ages[i]++;
							}
							state.ages[newstate]=0;
							console.log("NEWSTATE = " + newstate);
							console.log("ages = " + state.ages[0] + ", "+ state.ages[1] + ", "+ state.ages[2] + ", "+ state.ages[3] + ", "+ state.ages[4] + ", "+ state.ages[5] );
							return newstate;
						})());
					}
				}
			}
		}




        var myrequestAnimationFrame = utils.getRequestAnimationFrameFunc();

		var timeOrigin=performance.now();//Date.now();
		var serverTimeOrigin=0;
		var serverTime=0;
		var myID=0;
		var myRoom=undefined;


		var m_lastDisplayTick=0;
		var m_tickCount=0;
		var k_timeDisplayElm=window.document.getElementById("timeDisplayDiv");

		var gd = galleryDisplay(document.getElementById("svg_area"));

		gd.stateChangeListener(function(i){state.setState(i);});

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
							m_agent=undefined;
         				}
         				break;
     				case 65: //a
         				if ((e.ctrlKey)&&(e.shiftKey)){
         					m_agent=agentPlayer();
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

			m_agent && m_agent.reset();
				
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

			m_agent && m_agent.tick(t_sinceOrigin/1000.0);

			
				//console.log("auto state update");
				state.update(t_myMachineTime);
			
			gd.tick(state.currentPhase);

			// create a display clock tick every 1000 ms
			while ((t_sinceOrigin-m_lastDisplayTick)>1000){  // can tick more than once if computer went to sleep for a while...
				

				m_tickCount++;
				k_timeDisplayElm.innerHTML=Math.floor(m_lastDisplayTick/1000);
				m_lastDisplayTick += 1000;

				//console.log("t_myMachineTime is " + t_myMachineTime + ", and DOMHighResTimeStamp is " + hrts);
				//gd.setState(Math.floor(Math.random()*state.k_numStates));
			}

			myrequestAnimationFrame(timerLoop);

		};


		// INITIALIZATIONS --------------------

	}
);