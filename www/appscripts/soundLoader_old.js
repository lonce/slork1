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

			function retrieveSounds(cb){
				if (sndlist && (sndlist.length > 0)){

					var numReady=0;
					var sndsReady = function(i_str){
						numReady++;
						console.log("Finished loading  " + i_str + ", " + numReady + " sounds out of " + sndlist.length);
						msgbox.value = "loaded  "  + numReady + " sounds out of " + sndlist.length;
						if (numReady===sndlist.length){
							console.log("retrieveSound returning completely loaded sounds");
							cb(m_sounds);
						} 
					}

					var loadSound= function(i, cb){
						//console.log("load sound " + i);
						if (i < sndlist.length){
							loadSoundFromPath(sndlist[i], function(sndfactory){
								m_sounds[i]=sndfactory(sndsReady);
								console.log("done loading sound " + i);
								i++;
								loadSound(i, cb);
							}); 
						}else{
							return true; //cb(m_sounds);
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
						if (path.indexOf("jsaSound/") === 0){
							path = path.substr("jsaSound/".length);
							//console.log("loadSoundFromPath: " + path);
							cb(currentSMFactory);
						}
					}
				);
			}

			return retrieveSounds(cb);
	}
});