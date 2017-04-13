define(
    ["config", "soundLoader", "../utils/utils"],
    function (config, soundLoader, utils) {
		var msgbox = document.getElementById("msg");

    	var mvt = config.mvt;

   		var m_soundsLoaded=false;

 
		var sndlist=[
			"jsaSound/jsaModels/jsaOsc",
			"jsaSound/jsaModels/jsaDistributedDrone2",
			"jsaSound/jsaModels/ICMCStory/ThunderSample0",
			"jsaSound/jsaModels/ICMCStory/ThunderSample1",
			"jsaSound/jsaModels/ICMCStory/ThunderSample2",
			"jsaSound/jsaModels/Jeffers/RowingLoop",
			"jsaSound/jsaModels/GrannySwingDistributed",
			"jsaSound/jsaModels/GrannySwingDistributed",
			//"jsaSound/jsaModels/chirpExp"
			"jsaSound/jsaModels/peeperSyllable",
			"jsaSound/jsaModels/Distributed/GrannyVoiceGallery",
			]; // sound files to use for the piece, hardcoded

		var sm = {
			"osc" : 0,
			"metaDrone" : 1,
			"thunder0" : 2,
			"thunder1" : 3,
			"thunder2" : 4,
			"rowing" : 5,
			"swing1" : 6,
			"swing2" : 7,
			"peeper" : 8,
			"grannyvoice" : 9
		}

		var m_microTimer;
		var m_playingP=false;

		var m_role =0 ; // Gallery role is 0
		var m_roles;

		var IPlayer={};

		// Does this get called for Gallery???????????????????????????????
		IPlayer.setRole=function(i_role, i_roles){
			m_role=i_role;
			m_roles=i_roles;
			console.log("....my role is now "+ m_role + "of " + i_roles);
		}

		var setSndParam=function(i_pname, i_val){
			sndParams[i_pname]=i_val;
		}

		var sndParams = { // these are piece-specific
			"rissetSpacing": .25,
			"ref_microCycles": 30, 
			"microCycles": 0 
		}

		var snds;
		var k_numSnds=0;

		var m_nextSwingSnd; // for cycling through different sounds
		var m_nextThunderSnd=sm.thunder0;
		var m_oldMicroPhase=0;

		IPlayer.loadSounds=function(i_cb){
			soundLoader(sndlist, function(i_snds){
				snds=i_snds;
				k_numSnds=sndlist.length
				console.log("all sounds loaded, snds.length = " + snds.length);
				msgbox.value="all sounds loaded";

				var countResources=0;
				var ready = function(){
					countResources++;
					if (countResources===2){
						console.log("personal player: resources loaded");
						m_soundsLoaded=true;

						i_cb(); // this is when we are really done loading
					}
				}
				if (! (snds[sm.swing1] && snds[sm.swing1])) alert("using swing before initialized");
				snds[sm.swing1].on("resourceLoaded", ready);
				snds[sm.swing2].on("resourceLoaded", ready);

				snds[sm.swing1].setParam("Sound URL", config.resourcesPath + "jsaResources/sounds/swing/117259__end1.mp3");
				snds[sm.swing2].setParam("Sound URL", config.resourcesPath + "jsaResources/sounds/swing/117259__end2.mp3");

				if (! snds[sm.metaDrone]) alert("metadrone refed before loaded");
				snds[sm.metaDrone].setParam("Number of Generators", 1);
				
				}); // sb will be an array of sounds in the order specified by sndList
		}
		//var myrequestAnimationFrame = utils.getRequestAnimationFrameFunc();
		var m_mvtStartTime=Date.now(); //performance.now();

		var m_mvt=-1;
		var m_mvtDur=5000;//just a default

		var m_myMicroPlayPhase=0;
		var m_myMicroStopPhase=.7;

		IPlayer.allOff=function(){
			for (var i = 0; i<k_numSnds; i++){
				//console.log("stoping sound [" + i + "]");
				snds[i].setParam("play", 0);
			}
			m_playingP=false;
			clearTimeout(m_microTimer);
		}



		IPlayer.setMvtPhase=function(i_mvt,i_mvtDur){
			if (m_playingP && (m_mvt===i_mvt)) return;
			console.log("movement Duration will be=" + i_mvtDur);
			m_mvtStartTime=Date.now(); //performance.now();
			m_mvtDur=i_mvtDur;

			//console.log("----------------------------play mvt " + i_mvt)
			IPlayer.allOff();
			m_playingP=true;
			m_microTimer=setTimeout(phaseLoop, 50); //myrequestAnimationFrame(phaseLoop);

			switch(i_mvt){
				case mvt.METADRONE:
					m_myMicroPlayPhase=0;
					m_myMicroStopPhase=.9999;
					snds[sm.metaDrone].setParamNorm("Gain", .5);
					break;

				case mvt.RISSET:
					//if (m_playingP===false){
						snds[sm.osc].setParam("Attack Time", 5);
						snds[sm.osc].setParam("play", 1);
						snds[sm.osc].setParam("Frequency", 60);//+m_role*sndParams["rissetSpacing"]);
						snds[sm.osc].setParamNorm("Gain", .05);
					//}
					break;
				case mvt.THUNDER:					

					snds[m_nextThunderSnd].setParam("play", 1);
					snds[m_nextThunderSnd].setParamNorm("Gain", .45);
					m_nextThunderSnd = (m_nextThunderSnd === sm.thunder2) ? sm.thunder0 : (m_nextThunderSnd+1);
				
					break;
				case mvt.SWING:
					m_myMicroPlayPhase=0;
					console.log("My microphase playtime is " + m_myMicroPlayPhase);
					m_nextSwingSnd = sm.swing1;
					snds[sm.swing1].setParamNorm("Gain", .2);
					snds[sm.swing2].setParamNorm("Gain", .2);
					break;
				case mvt.PEEPER:
					sndParams.ref_microCycles=30- Math.min(m_roles, 10);
					m_myMicroPlayPhase=0;
					m_myMicroStopPhase=.16 + .06*Math.random();
					m_myMicroStopPhase=(0 + (.16 -.01*Math.min(m_roles, 10))+ .06*Math.random()) % 1;

					snds[sm.peeper].setParamNorm("Gain", .15);

					// for ChirpExp
					//snds[sm.peeper].setParam("Carrier Frequency", 4800);
					//snds[sm.peeper].setParam("Modulator Frequency", 18+4*Math.random());

					snds[sm.peeper].setParam("Center Frequency (octaves)", 3.35);
					snds[sm.peeper].setParam("Chirp Rate", 18+4*Math.random());

					snds[sm.peeper].setParamNorm("Gain", .15);
					sndParams.microCycles=sndParams.ref_microCycles+6*(Math.random()-.5);
					break;
				
				case mvt.GRANNYVOICE:
					m_myMicroPlayPhase=.9;
					msgbox.value="grannyvoice" + snds[sm.grannyvoice];
					snds[sm.grannyvoice].setParam("play", 1);
					snds[sm.grannyvoice].setParamNorm("Gain", .35);
					break;

				default: 
					break;
			}
							
			m_mvt=i_mvt;
		}


		var phaseLoop=function(hrts){
			if (! m_playingP) return;

			var t = (hrts ? hrts : Date.now()); //performance.now());

			var mvtTime=t-m_mvtStartTime;
			var mvtPhase=(mvtTime/m_mvtDur)%1;
			var microPhase=mvtPhase; // default for this local variable;

			//console.log("t is " + t);

			switch(m_mvt){

				case mvt.METADRONE:
					microPhase=(mvtPhase*10)%1;
					if (((m_oldMicroPhase<=microPhase)&&(m_oldMicroPhase <= m_myMicroPlayPhase) && (m_myMicroPlayPhase < microPhase)) ||
						((m_oldMicroPhase>=microPhase)&&(m_oldMicroPhase >= m_myMicroPlayPhase) && (m_myMicroPlayPhase < microPhase))){
						snds[sm.metaDrone].setParam("play", 1);
					}	else
					if (((m_oldMicroPhase<=microPhase)&&(m_oldMicroPhase <= m_myMicroStopPhase) && (m_myMicroStopPhase < microPhase)) ||
						((m_oldMicroPhase>=microPhase)&&(m_oldMicroPhase >= m_myMicroStopPhase) && (m_myMicroStopPhase < microPhase))){
						snds[sm.metaDrone].setParam("play", 0);
					}	
					m_oldMicroPhase = microPhase;
					break;


				case mvt.SWING:
					microPhase=(mvtPhase*10)%1;
					//console.log("microPhase = " + microPhase);

					if (((m_oldMicroPhase<=microPhase)&&(m_oldMicroPhase <= m_myMicroPlayPhase) && (m_myMicroPlayPhase < microPhase)) ||
						((m_oldMicroPhase>=microPhase)&&(m_oldMicroPhase >= m_myMicroPlayPhase) && (m_myMicroPlayPhase < microPhase))){
						snds[m_nextSwingSnd].setParam("play", 1);
						//m_playingP=true;

						m_nextSwingSnd = (m_nextSwingSnd === sm.swing1) ? sm.swing2 : sm.swing1;
						console.log("m_nextSwingSnd = " + m_nextSwingSnd);
					}
					m_oldMicroPhase = microPhase;
					break;


				case mvt.GRANNYVOICE:
					microPhase=(mvtPhase*3)%1;
					//console.log("microPhase = " + microPhase);

					if (((m_oldMicroPhase<=microPhase)&&(m_oldMicroPhase <= m_myMicroPlayPhase) && (m_myMicroPlayPhase < microPhase)) ||
						((m_oldMicroPhase>=microPhase)&&(m_oldMicroPhase >= m_myMicroPlayPhase) && (m_myMicroPlayPhase < microPhase))){
						snds[sm.grannyvoice].setParam("play", 1);
					}
					m_oldMicroPhase = microPhase;
					break;

				case mvt.PEEPER:
					microPhase=(mvtPhase*sndParams.microCycles)%1;
					if (((m_oldMicroPhase<=microPhase)&&(m_oldMicroPhase <= m_myMicroPlayPhase) && (m_myMicroPlayPhase < microPhase)) ||
						((m_oldMicroPhase>=microPhase)&&(m_oldMicroPhase >= m_myMicroPlayPhase) && (m_myMicroPlayPhase < microPhase))){
						snds[sm.peeper].setParam("play", 1);
					}	else
					if (((m_oldMicroPhase<=microPhase)&&(m_oldMicroPhase <= m_myMicroStopPhase) && (m_myMicroStopPhase < microPhase)) ||
						((m_oldMicroPhase>=microPhase)&&(m_oldMicroPhase >= m_myMicroStopPhase) && (m_myMicroStopPhase < microPhase))){
						snds[sm.peeper].setParam("play", 0);
					}	
					m_oldMicroPhase = microPhase;
					break;


				default:
					break;
			}

			m_microTimer=setTimeout(phaseLoop, 50);
			//m_microTimer=myrequestAnimationFrame(phaseLoop);
		};




	
		return IPlayer;
    });