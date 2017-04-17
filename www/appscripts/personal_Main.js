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
	["require",  "../utils/comm", "../utils/utils",  "config", "personalConfig", "personalDisplay", "player_personal",  "polyfill"],

	function (require,  commFactory, utils,  config, personalConfig, personalDisplay,  player) {

		

			var comm=commFactory(function(){
				console.log("OK comms ready for action!");
			});
			
			var m_ty = document.getElementById("ty");
			var m_troll = document.getElementById("troll");

			var msgbox = document.getElementById("msg");


			//var configure = function (){
			personalConfig.report(function(){
				if (myRoom != undefined) comm.sendJSONmsg("unsubscribe", [myRoom]);
	    		myRoom  = personalConfig.room;
	    		msgbox.value="sub " + myRoom;
				if (myRoom != undefined) {
					console.log("personalConfig.report: joing a room named " + myRoom); 
					comm.sendJSONmsg("subscribe", [myRoom]);
					// Tell everybody in the room to restart their timers.
					comm.sendJSONmsg("startTime", []);

					pd.setColor(utils.hslToRgb(Math.random(), 1, .5));
					var foo = pd.getColor();
					comm.sendJSONmsg("colorID", [foo]);



					//++++++++++++++++++++++++++++++++++++
					var da = document.getElementById("wrap");
					da.addEventListener("fullscreenerror", function(){console.log("fullscreenerror");});
					da.addEventListener("fullscreenchange", function(){console.log("fullscreenchange");});

					if (da.requestFullscreen) { // W3C API
				        da.requestFullscreen();
				    } else if (da.mozRequestFullscreen) { // Mozilla current API
				        da.mozRequestFullscreen();
				    } else if (da.webkitRequestFullscreen) { // Webkit current API
				        foo=da.webkitRequestFullscreen();
				        console.log("da.fullscreenEnabled = " + da.fullscreenEnabled );
				        // TRY CAPITAL 'S' AS WELL
				    } else if (da.requestFullScreen) { // W3C API
				        da.requestFullScreen();
				    } else if (da.mozRequestFullScreen) { // Mozilla current API
				        da.mozRequestFullScreen();
				    } else if (da.webkitRequestFullScreen) { // Webkit current API
				        foo=da.webkitRequestFullScreen();
				        console.log("da.fullscreenEnabled = " + da.fullScreenEnabled );
				    } else 				    {
				    	console.log("no requestfullscreen");
				    }

				    setTimeout(function(){
				    	if (!da.webkitCurrentFullScreenElement) {
				    			console.log("your element is not in full screen!");
				    	} else {
				    		console.log("your element seems to be in full screen");
				    	}}, 2000);
				    //++++++++++++++++++++++++++++++++++++++++++

				    //var lockOrientation = screen.lock || screen.mozLockOrientation || screen.msLockOrientation;

					if ('orientation' in screen) {
					   console.log("orientation should be supported");
					   screen.orientation.lock("portrait-primary");
					} else {
					   console.log("orientation NOT supported :-(");
					}

 					//++++++++++++++++++++++++++++++++++++++++++

				} else{
					alert("myRoom is undefined .... Not Subscribeding")
				}

				timerLoop(performance.now());  // fire it up
			});
			


	        var myrequestAnimationFrame = utils.getRequestAnimationFrameFunc();
			var timeOrigin=performance.now();//Date.now();

			var serverTimeOrigin=0;
			var serverTime=0;
			var myID=0;
			var myRoom=undefined;


			var m_lastDisplayTick=0;
			var m_tickCount=0;

			// reduce GUI burden // var k_timeDisplayElm=window.document.getElementById("timeDisplayDiv");

			var pd = personalDisplay(document.getElementById("svg_area"));
			//document.getElementById("svg_area").innerHTML="Hellow World"

			/*
			var wakeButton = window.document.getElementById("wakeButton");
			var stayAwake = function(){
				wakeButton.click();
				console.log("stay awake click");
				setTimeout(stayAwake, 30000);
			};
			stayAwake();
			*/

			pd.on("play", function(){
				player.setSndParam("noteNum", pd.getRingIndex());
				//comm.sendJSONmsg("play", [pd.getNormedRadius(), pd.getAngle(), pd.getRate()]);
				comm.sendJSONmsg("play", [.8, 0, 0]);
				//player.play();
			});
			
			pd.on("release", function(){
				console.log("personal about to send release message")
				comm.sendJSONmsg("release", []);
				//player.release();
			});
		

	//---------------------------------------------------------------
	//Messages
			//---------------------------------------------------------------------------
			// init is called just after a client navigates to the web page
			// 	data[0] is the client number we are assigned by the server.
			comm.registerCallback('init', function(data) {
				//pong.call(this, data[1]);
				myID=data[0];
				console.log("Server acknowledged, assigned me this.id = " + myID);
				msgbox.value = "my ID is " + myID;

				personalConfig.set("serverAck");
				player.loadSounds(function(){
					personalConfig.set("soundsLoaded");
				});
				//player.loadSounds(configure);
				//configure();



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
				//console.log("server startTime = " + data[0] );


					
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
			// Just make a color for displaying future events from the client with the src ID
			comm.registerCallback('newRole', function(data, src) {
				//console.log("new role : " + data[0] + " of " + data[1]);
				player.setRole(data[0], data[1]);
			});
			//---------------------------------------------------------------------------
			// Just make a color for displaying future events from the client with the src ID
			comm.registerCallback('mvtPhase', function(data, src) {
				//console.log("message: Mvt : " + data[0] + " , Phase " + data[1]);
				msgbox.value="mvtPhase";
				player.setMvtPhase(data[0], data[1]);
			});

			//---------------------------------------------------------------------------
			// src is meaningless since it is this client
			comm.registerCallback('roommembers', function(data, src) {
				if (myID===0) alert("ACK");
				if (data.length > 1) 
						console.log("there are other members in this room!");
				for(var i=0; i<data.length;i++){
					if (data[i] != myID){
						console.log("room member IDs: " + data[i]);
					}
				}
			});


			comm.registerCallback('allOff', function(data, src) {
				console.log("message: allOff : " );
				player.allOff();
			});



	//------------------------------------------------------------------
	// orientation
	//------------------------------------------------------------------
			// all in degrees
			var ocount=0;
			var m_eventBeta;
			var m_eventGamma;
			var devOrientHandler = function(eventData){ 
				// beta is pitch
				// alpha is yaw
				// gamma is roll

				//m_msg.value="ocount "+ ocount;
				if (eventData.beta){
			    	// reduce GUI burden //m_ty.value = eventData.beta.toFixed(2);  				
					// reduce GUI burden //pd.setPitch(eventData.beta);
					m_eventBeta = eventData.beta;
				}

				if(eventData.gamma){
			   		// reduce GUI burden //m_troll.value = eventData.gamma.toFixed(2);  
			    	// reduce GUI burden //pd.setAngle(eventData.gamma);
			    	m_eventGamma = eventData.gamma;
			    }
			}

			var drawTimer = setInterval(function(){
					if (! (m_eventBeta && m_eventGamma)) return; // not getting data yet
					pd.setPitch(m_eventBeta);
					pd.setAngle(m_eventGamma);
					player.setSndParam("Detune", m_eventGamma/90);
					
					/*
					if (player.isPlaying()){
						comm.sendJSONmsg("rateChange", [pd.getRate()]);
					}
					*/
					//if (pd.playButton.pushedP){
					comm.sendJSONmsg("devicePitch", [m_eventBeta]);
					//}

			}, 100);

			if (window.DeviceOrientationEvent) {
			  // Listen for the event and handle DeviceOrientationEvent object
			  window.addEventListener('deviceorientation', devOrientHandler, false);
			} else{
				console.log("Device orientation not supported");
				alert("Device orientation not supported");
			}

	

			// ++++++++++++++++++++++++++++++++++++++++

			var blink = function(dur){
				pd.setBackground("purple");
				setTimeout(function(){
					pd.setBackground("black");
				}, dur);

			}

	
			//	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			var t_myMachineTime;
			var t_count=0;
			var timerLoop = function(hrts){  // DOMHighResTimeStamp


				if (hrts===undefined) hrts=performance.now();

				t_myMachineTime = hrts;
				t_sinceOrigin = t_myMachineTime-timeOrigin;

				pd.tick(t_myMachineTime);

				// create a display clock tick every 1000 ms
				while ((t_sinceOrigin-m_lastDisplayTick)>1000){  // can tick more than once if computer went to sleep for a while...
					m_tickCount++;
//					k_timeDisplayElm.innerHTML=Math.floor(m_lastDisplayTick/1000);
					m_lastDisplayTick += 1000;


				}

				//myrequestAnimationFrame(timerLoop);
				setTimeout(timerLoop, 100);

			};



	
		//});

	}
);