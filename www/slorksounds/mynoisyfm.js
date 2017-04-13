require.config({
    paths: {"jsaSound": "http://animatedsoundworks.com:8001"}
});
// Set path to models served from animatedsoundworks 
// To use the sound on a web page with its current parameters (and without the slider box):
define(
 ["jsaSound/jsaModels/NoisyFM"],

function(sndFactory){
  return function(cb){
    return sndFactory(function(snd){

        snd.setParam("play", 0);
        snd.setParam("Carrier Frequency", 200);
        snd.setParam("Modulation Index", 1000);
        snd.setParam("Gain", 0.3);
        snd.setParam("Attack Time", 0.05);
        snd.setParam("Release Time", 1);
        cb && cb(snd);
    });
  }
});
