var WildEmitter = require('wildemitter');

function getMaxVolume (analyser, fftBins) {
  var maxVolume = -Infinity;
  analyser.getFloatFrequencyData(fftBins);

  for(var i=4, ii=fftBins.length; i < ii; i++) {
    if (fftBins[i] > maxVolume && fftBins[i] < 0) {
      maxVolume = fftBins[i];
    }
  };

  return maxVolume;
}


var audioContextType = window.AudioContext || window.webkitAudioContext;
// use a single audio context due to hardware limits
var audioContext = null;
module.exports = function(stream, options) {
  var harker = new WildEmitter();


  // make it not break in non-supported browsers
  if (!audioContextType) return harker;

  //Config
  var options = options || {},
      smoothing = (options.smoothing || 0.1),
      threshold = options.threshold,
      play = options.play,
      history = options.history || 10,
      timer;

  //Setup Audio Context
  if (!audioContext) {
    audioContext = new audioContextType();
  }
  var sourceNode, fftBins, analyser;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = smoothing;
  fftBins = new Float32Array(analyser.fftSize);

  if (stream.jquery) stream = stream[0];
  if (stream instanceof HTMLAudioElement || stream instanceof HTMLVideoElement) {
    //Audio Tag
    sourceNode = audioContext.createMediaElementSource(stream);
    if (typeof play === 'undefined') play = true;
    threshold = threshold || -50;
  } else {
    //WebRTC Stream
    sourceNode = audioContext.createMediaStreamSource(stream);
    threshold = threshold || -50;
  }

  sourceNode.connect(analyser);
  if (play) analyser.connect(audioContext.destination);

  harker.speaking = false;

  harker.setThreshold = function(t) {
    threshold = t;
  };

  harker.stop = function() {
    cancelAnimationFrame(timer);
    harker.emit('volume_change', -100, threshold);
    if (harker.speaking) {
      harker.speaking = false;
      harker.emit('stopped_speaking');
    }
    analyser.disconnect();
    sourceNode.disconnect();
  };
  harker.speakingHistory = [];
  for (var i = 0; i < history; i++) {
      harker.speakingHistory.push(0);
  }

  function checkVolume() {
    var currentVolume = getMaxVolume(analyser, fftBins);

    harker.emit('volume_change', currentVolume, threshold);

    var history = 0;
    if (currentVolume > threshold && !harker.speaking) {
      // trigger quickly, short history
      for (var i = harker.speakingHistory.length - 3; i < harker.speakingHistory.length; i++) {
        history += harker.speakingHistory[i];
      }
      if (history >= 2) {
        harker.speaking = true;
        harker.emit('speaking');
      }
    } else if (currentVolume < threshold && harker.speaking) {
      for (var i = 0; i < harker.speakingHistory.length; i++) {
        history += harker.speakingHistory[i];
      }
      if (history == 0) {
        harker.speaking = false;
        harker.emit('stopped_speaking');
      }
    }
    harker.speakingHistory.shift();
    harker.speakingHistory.push(0 + (currentVolume > threshold));

    timer = requestAnimationFrame(checkVolume);
  }

  checkVolume();

  return harker;
}
