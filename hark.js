var WildEmitter = require('wildemitter');

module.exports = function(stream) {
  var speakingThreshold = -45;
  var smoothing = 0.5;
  var pollPeriod = 100;
  var audioContext = new webkitAudioContext();
  var sourceNode = audioContext.createMediaStreamSource(stream);
  var analyser = audioContext.createAnalyser();
  var fftBins = new Float32Array(analyser.fftSize);

  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = smoothing;
  sourceNode.connect(analyser);

  var emitter = new WildEmitter();
  var speaking = false;

  // Poll the analyser node to determine if speaking
  // and emit events if changed
  setInterval(function() {
    var currentVolume = -Infinity;
    analyser.getFloatFrequencyData(fftBins)

    for(var i=0, ii=fftBins.length; i < ii; i++) {
      if (fftBins[i] > currentVolume && fftBins[i] < 0) {
        currentVolume = fftBins[i];
      }
    };

    if (currentVolume > speakingThreshold) {
      if (!speaking) {
        speaking = true;
        emitter.emit('speaking');
      }
    } else {
      if (speaking) {
        speaking = false;
        emitter.emit('stopped_speaking');
      }
    }
  }, pollPeriod);

  return emitter;
}
