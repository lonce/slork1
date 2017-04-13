define(
    ["config", "soundLoader", "../utils/utils"],
    function (config, soundLoader, utils) {
		var msgbox = document.getElementById("msg");
		var mvt = config.mvt;
		var m_currentMvt=-1;

		var m_soundsLoaded=false;

		var sndlist=[

			"jsaSound/jsaModels/dong",	
			//"../slorksounds/MyRisset",			
			"jsaSound/jsaModels/Leonardo/jsaDistributedDrone2Leonardo",
			//"jsaSound/jsaModels/jsaFMnative2",
			//"jsaSound/jsaModels/SoD/Dragster",
			//"jsaSound/jsaModels/peeperSyllable",
			//"jsaSound/jsaModels/jsaPluck",
			//"jsaSound/jsaModels/peeperSyllable"
		]; // sound files to use for the piece, hardcoded

		var sm = {
			"osc" : 0,
			"metaDrone" : 1,
			"rainLoop" : 2,
			"rowing" : 3,
			"swing1" : 4,				
			"swing2" : 5,
			"grannyvoice" : 6,
			"peeper" : 7
		}
		var m_microTimer;
		var m_playingP=false;

		var m_role;
		var m_roles;

		var IPlayer={};


		IPlayer.play=function(idx=0){
			//console.log("player: play");
			//snds[sm.metaDrone].setParam("play", 1);
			snds[idx].setParam("play", 1)
			m_playingP=true;
		}

		IPlayer.release=function(idx=0){
			//console.log("player: release");
			//snds[sm.metaDrone].setParam("play", 0);
			snds[idx].setParam("play", 0)
			m_playingP=false;
		}

		IPlayer.isPlaying=function(){
			return m_playingP;
		}

		IPlayer.setRole=function(i_role, i_roles){
			m_role=i_role;
			m_roles=i_roles;
			console.log("....my role is now "+ m_role + "of " + i_roles);		

			snds[sm.metaDrone].setParam("Number of Generators", 4-Math.min(3, i_roles));

			if (m_currentMvt === mvt.GRANNYVOICE){
					snds[sm.grannyvoice].setRole(m_role, m_roles);
				}
		}

		IPlayer.setSndParam=function(i_pname, i_val){
			sndParams[i_pname]=i_val;

			if (i_pname==="noteNum"){
				snds[sm.metaDrone].setParam("First Note Number", i_val);
			}
			if (i_pname==="Detune"){
				snds[sm.metaDrone].setParam("Detune", i_val);
			}
			
		}

		var sndParams = { // these are piece-specific
			"rissetSpacing": .25,
			"ref_microCycles": 30, 
			"microCycles": 0,
			"noteNum": 0
		}

		var snds;
		var k_numSnds=0;

		var m_nextSnd; // for cycling through different sounds
		var m_oldMicroPhase=0;

		IPlayer.loadSounds=function(i_cb){
			soundLoader(sndlist, function(i_snds){
				snds=i_snds;
				k_numSnds=sndlist.length;
				console.log("all sounds loaded, snds.length = " + snds.length);
				msgbox.value="all sounds loaded";
				snds[sm.metaDrone].setParam("Number of Generators", 1);
				i_cb();

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
				snds[i] && snds[i].release();
			}
			m_playingP=false;
			clearTimeout(m_microTimer);
		}


		var fcount=0;
		var temp;
		IPlayer.setMvtPhase=function(i_mvt,i_mvtDur){
			msgbox.value="mvt " + i_mvt + ", dur = " + i_mvtDur;
			if (! m_soundsLoaded) {
				fcount++
				msgbox.value="Sounds Not Loaded!! " + fcount;
				return;
			}


			if (m_playingP && (m_mvt===i_mvt)) return;
			console.log("movement Duration will be=" + i_mvtDur);
			m_mvtStartTime=Date.now(); //performance.now();
			m_mvtDur=i_mvtDur;
			m_currentMvt = i_mvt;

			//console.log("----------------------------play mvt " + i_mvt)
			IPlayer.allOff();
			m_playingP=true;
			m_microTimer=setTimeout(phaseLoop, 50); //myrequestAnimationFrame(phaseLoop);

			switch(i_mvt){
				case mvt.METADRONE:
					m_myMicroPlayPhase=0;
					m_myMicroStopPhase=.7;
					snds[sm.metaDrone].setParamNorm("Gain", .5);

					switch (m_roles){
						case 1:
							snds[sm.metaDrone].setParam("Number of Generators", 3);
						break;

						case 2:
							snds[sm.metaDrone].setParam("Number of Generators", 2);
						break;

						default:
							snds[sm.metaDrone].setParam("Number of Generators", 1);
						break;
					}


					break;
				case mvt.RISSET:
					msgbox.value="risset" + snds[sm.osc];
					snds[sm.osc].setParam("Attack Time", 5);
					snds[sm.osc].setParam("play", 1);
					snds[sm.osc].setParam("Frequency", 60+m_role*sndParams["rissetSpacing"]);
					snds[sm.osc].setParamNorm("Gain", .1);
					break;
				case mvt.THUNDER:
					msgbox.value="rain" + snds[sm.rainLoop];
					snds[sm.rainLoop].setParam("Attack Time", 5);
					snds[sm.rainLoop].setParam("Loop Start Phase", Math.random());
					snds[sm.rainLoop].setParam("play", 1);
					break;
				case mvt.SWING:
					m_myMicroPlayPhase=Math.random();
					m_nextSnd = sm.swing1;
					snds[sm.swing1].setParamNorm("Gain", .6);
					snds[sm.swing2].setParamNorm("Gain", .2);

					console.log("My microphase playtime is " + m_myMicroPlayPhase);
					break;
				case mvt.GRANNYVOICE:
					msgbox.value="grannyvoice" + snds[sm.grannyvoice];
					snds[sm.grannyvoice].setRole(m_role, m_roles);
					snds[sm.grannyvoice].setParam("play", 1);
					snds[sm.grannyvoice].setParamNorm("Gain", .25);
					break;
				case mvt.PEEPER:
					sndParams.ref_microCycles=30- Math.min(m_roles, 10);
					console.log("ref_microCycles=" + sndParams.ref_microCycles);
					m_myMicroPlayPhase=Math.random();
					m_myMicroStopPhase=(m_myMicroPlayPhase + (.16 -.01*Math.min(m_roles, 10))+ .06*Math.random()) % 1;
					console.log("peeper start phase is " + m_myMicroPlayPhase + ", and stop phase is " + m_myMicroStopPhase);

					temp = Math.random();  // for cf and volume (higher cf needs more volume)
					snds[sm.peeper].setParamNorm("Gain", .10+.1*temp);

					// for ChirpExp
					//snds[sm.peeper].setParam("Carrier Frequency", 4400 + 600*temp);
					//snds[sm.peeper].setParam("Modulator Frequency", 16+8*Math.random());
					snds[sm.peeper].setParam("Center Frequency (octaves)", 3.25 + .2*temp);
					snds[sm.peeper].setParam("Chirp Rate", 16+8*Math.random());


					sndParams.microCycles=sndParams.ref_microCycles+6*(Math.random()-.5);
					console.log("microCycles=" + sndParams.microCycles);
					break;


				default: 
					//if (m_playingP===false){
						//snds[i_mvt].setParam("play", 1);
						//snds[i_mvt].setParamNorm("Gain", 1);
						//console.log("PLAY");

					//} 
			}
							

			m_mvt=i_mvt;
		}

		var granny = {
			"ref":.1,  //reference value for parameters
			"interval": 1,  // baseline factor rel ref
			"grainSizeFactor": 2, // relative to ref
			"stepSizeFactor": 1, // relative to ref
		}


		var phaseLoop=function(hrts){
			if (! m_playingP) return;

			var t = (hrts ? hrts : Date.now()); //performance.now());

			var mvtTime=t-m_mvtStartTime;
			var mvtPhase=(mvtTime/m_mvtDur)%1;
			var microPhase=mvtPhase; // default for this local variable;
			var microSin;


			//console.log("t is " + t);

			switch(m_mvt){

				case mvt.METADRONE:
					microPhase=(mvtPhase*10)%1;
					if (((m_oldMicroPhase<=microPhase)&&(m_oldMicroPhase <= m_myMicroPlayPhase) && (m_myMicroPlayPhase < microPhase)) ||
						((m_oldMicroPhase>=microPhase)&&(m_oldMicroPhase >= m_myMicroPlayPhase) && (m_myMicroPlayPhase < microPhase))){
						msgbox.value="metaDrone" + snds[sm.metaDrone];
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
						msgbox.value="swing" + snds[m_nextSnd];
						snds[m_nextSnd].setParam("play", 1);
						//m_playingP=true;

						m_nextSnd = (m_nextSnd === sm.swing1) ? sm.swing2 : sm.swing1;
						console.log("m_nextSnd = " + m_nextSnd);
					}
					m_oldMicroPhase = microPhase;
					break;


				case mvt.GRANNYVOICE:
						microPhase=(mvtPhase*10)%1;
						microSin=Math.sin(2*Math.PI*microPhase);
						granny.ref=.1*Math.pow(2,microSin);

						snds[sm.grannyvoice].setParam("Grain Play Interval", granny.ref);

						microPhase=(mvtPhase*3.25)%1;
						microSin=Math.sin(2*Math.PI*microPhase);
						//snds[sm.grannyvoice].setParam("Grain Size", granny.grainSizeFactor*Math.pow(2,microSin)*granny.ref);
						snds[sm.grannyvoice].setParam("Grain Size", granny.grainSizeFactor*Math.pow(2,microSin)*granny.ref);

						microPhase=(mvtPhase*2.25)%1;
						microSin=Math.sin(2*Math.PI*microPhase);
						snds[sm.grannyvoice].setParam("Step Size", granny.stepSizeFactor*Math.pow(2,1*microSin)*granny.ref);

						snds[sm.grannyvoice].setParam("Randomize Pitch", mvtPhase);
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