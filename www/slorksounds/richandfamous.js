require.config({
    paths: {"jsaSound": "http://animatedsoundworks.com:8001"}
});
// Set path to models served from animatedsoundworks 
// To use the sound on a web page with its current parameters (and without the slider box):
define(
 ["jsaSound/jsaModels/Granularize"],

function(sndFactory){
  return function(cb){
    return sndFactory(function(snd){

        snd.setParam("play", 0);
        snd.setParam("Pitch", 0);
        snd.setParam("Randomize Pitch", 0.88);
        snd.setParam("Grain Size", 0.48);
        snd.setParam("Step Size", 0.18);
        snd.setParam("Grain Play Interval", 0.06);
        snd.setParam("File Loop Start", 0);
        snd.setParam("File Loop Length", 1);

  //URL params can take some time to load - when done, they trigger the "resourceLoaded" event. 
        snd.on("resourceLoaded", function(){
          console.log("----- sound loaded, so Play!");
          cb && cb(snd);
  // snd.setParam("play", 1);
        });
        snd.setParam("Sound URL", "http://animatedsoundworks.com:8001/jsaResources/sounds/BeingRuralshort22k.mp3");

        snd.setParam("Gain", 0.4);
    });
  }
});
