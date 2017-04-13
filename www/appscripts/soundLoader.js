require.config({
	paths: {
		"jsaSound": (function(){
			if (! window.document.location.hostname){
				alert("This page cannot be run as a file, but must be served from a server (e.g. animatedsoundworks.com:8001, or localhost:8001)." );
			}
			// jsaSound server is hardcoded to port 8001 (on the same server as jsaBard - or from animatedsoundworks)
				//LOCAL var host = "http://"+window.document.location.hostname + ":8001";
				var host = "http://"+window.document.location.hostname + ":8001";
				//var host = "http://"+"172.23.68.214" + ":8001";
				//alert("will look for sounds served from " + host);
				return (host );
			})(),
		"jquery": "http://ajax.googleapis.com/ajax/libs/jquery/2.0.2/jquery.min"
	}
});
define(
	["require"],
	function (require) {

		return function (sndlist, cb){
			var msgbox = document.getElementById("msg");

			var m_sounds=[]; // list of sounds used during the whole piece

			var m_sndResourcesLoaded=false;

			function retrieveSounds(cb){
				if (sndlist && (sndlist.length > 0)){

					var numReady=0;
					var sndsReady = function(i_snd){
						numReady++;
						console.log("Finished loading  " + i_snd.getName() + ", " + numReady + " sounds out of " + sndlist.length);
						msgbox.value = "loaded  "  + numReady + " sounds out of " + sndlist.length;
						if (numReady===sndlist.length){
							m_sndResourcesLoaded=true;
							console.log("retrieveSound returning completely loaded sounds");
						} 
					}

					var ugly = function(){
						console.log("soundLoader: ugly");
						if (m_sndResourcesLoaded){
							cb(m_sounds);
							return;
						}
						setTimeout(ugly, 100);
					}

					var loadSound= function(i, cb){
						//console.log("load sound " + i);
						if (i < sndlist.length){
							loadSoundFromPath(sndlist[i], function(sndfactory){
								/* This assures the sounds are returned in the same order they are requested */
								m_sounds[i]=sndfactory(sndsReady);
								console.log("done loading sound " + i);
								i++;
								loadSound(i, cb);
							}); 
						}else{
							/* and this assures we don't return until all resources are loaded */
							ugly();  // fix this, bonehead!
						}
					}
					loadSound(0, cb);
				} else{
					cb([]);
				}
			};

/*
			function retrieveSounds(){
				for(var i=0;i<sndlist.length;i++){
					loadSoundFromPath(sndlist[i], function(sndfactory){
						m_sounds[i]=sndfactory();
					})
				}
				return m_sounds;
			};
*/
			function loadSoundFromPath(path, cb) {
				require(
					// Get the model
					[path], 
					function (currentSMFactory) {
						if (path.indexOf("jsaSound/") === 0){ // strip it off first
							path = path.substr("jsaSound/".length);
							//console.log("loadSoundFromPath: " + path);
							cb(currentSMFactory);
						} else{
							cb(currentSMFactory);
						}
					}
				);
			}

			return retrieveSounds(cb);
	}
});