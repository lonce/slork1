require.config({
    paths: {"jsaSound": "http://animatedsoundworks.com:8001"}
});
// Set path to models served from animatedsoundworks 
// To use the sound on a web page with its current parameters (and without the slider box):
define(
 ["jsaSound/jsaModels/Distributed/GrannyVoice"],

function(sndFactory){
  return function(cb){
    return sndFactory(function(snd){

        snd.setParam("play", 0);
        snd.setParam("Pitch", -0.6);
        snd.setParam("Randomize Pitch", 0.69);
        snd.setParam("Grain Size", 0.13);
        snd.setParam("Step Size", 0.14);
        snd.setParam("Grain Play Interval", 0.06);
        snd.setParam("File Loop Start", 0.04);
        snd.setParam("File Loop Length", 0.4);

  //URL params can take some time to load - when done, they trigger the "resourceLoaded" event. 
        snd.on("resourceLoaded", function(){
          console.log("----- sound loaded, so Play!");
          cb && cb(snd);
  // snd.setParam("play", 1);
        });
        //snd.setParam("Sound URL", "http://animatedsoundworks.com:8001/jsaResources/sounds/milloyGlobalWarming_sm.mp3");

        snd.setParam("Gain", 0.4);
    });
  }
});
