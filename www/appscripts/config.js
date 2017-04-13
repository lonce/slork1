define(
	function () {
		exports = {};
		exports.webkitAudioEnabled=true;

		if (!window.webkitAudioContext && !window.AudioContext) {
			alert("Web Audio API is not supported - you can play, but you your device will not sound.");
			exports.webkitAudioEnabled=false;
		}

		exports.touchMarginOfError = 3; //px, used for "selecting" items on the score
		exports.minSndDuration=60; // must be longer than frame duration so start and stop and not sent to the synthesizer at the same time. 

		exports.maxContourWidth=0; //set this in main 

		exports.resourcesPath = "http://"+window.document.location.hostname + ":8001/";
		
    	exports.mvt = {
    			"METADRONE": 0,
    			"RISSET": 1,
    			"THUNDER": 2,
    			"SWING": 3,
    			"GRANNYVOICE" : 4,
    			"PEEPER" : 5
    		};


		return exports;
});

