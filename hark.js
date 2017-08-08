
var WildEmitter = require('wildemitter');
/* https://stackoverflow.com/questions/7944460/detect-safari-browser
Safari's audio detection appears to be less sensitive than Chromes. i.e. it takes more
volume to reach the threshold. So for safari we need to lower the threshold  */
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

function getMaxVolume (analyser, fftBins) {
  var maxVolume = -Infinity;
  for(var i=4, ii=fftBins.length; i < ii; i++) {
    if (fftBins[i] > maxVolume && fftBins[i] < 0) {
      maxVolume = fftBins[i];
    }
  };
  return maxVolume;
}

var audioContextType;
if (typeof window !== 'undefined') {
  audioContextType = window.AudioContext || window.webkitAudioContext;
}
// use a single audio context due to hardware limits
var audioContext = null;
module.exports = function(stream, options) {
  var harker = new WildEmitter();

  // make it not break in non-supported browsers
  if (!audioContextType) return harker;

  //Config
  var options = options || {},
      smoothing = (options.smoothing || 0.1),
      interval = (options.interval || 50),
      threshold = options.threshold,
      play = options.play,
      history = options.history || 10,
      frequencyRange = options.frequencyRange || [85, 255], // [85, 255] is the typical fundamental freq range for human speech
      fftSize = options.fftSize || 512,
      running = true;

  //Setup Audio Context
  if (!audioContext) {
    audioContext = new audioContextType();
  }
  var sourceNode, fftBins, analyser;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = smoothing;
  fftBins = new Float32Array(analyser.frequencyBinCount);
  // Freq spread is the number of hz each bin accounts for
  const frequencySpread = audioContext.sampleRate/(analyser.fftSize)


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

  if (isSafari) threshold -= 25;

  sourceNode.connect(analyser);
  if (play) analyser.connect(audioContext.destination);

  harker.speaking = false;

  harker.setThreshold = function(t) {
    threshold = t;
  };

  harker.setInterval = function(i) {
    interval = i;
  };

  harker.stop = function() {
    running = false;
    harker.emit('volume_change', -100, threshold);
    if (harker.speaking) {
      harker.speaking = false;
      harker.emit('stopped_speaking');
    }
    analyser.disconnect();
    sourceNode.disconnect();
  };

  harker.speakingHistory = new Array(history).fill(0)

  // Check if the volume of fundamental freq is > threshold
  function frequencyAnalyser(range, frequencySpread, fftBins) {
    analyser.getFloatFrequencyData(fftBins);
    const start = range[0];
    const end = range[1];
    const startIndex = Math.round(start / frequencySpread);
    const endIndex = Math.round(end / frequencySpread);
    const fundamentalFreqArray = fftBins.slice(startIndex, endIndex);
    const avgVol = fundamentalFreqArray.reduce(function(a, b) {
      return a + b
    }, 0) / fundamentalFreqArray.length;
    if (avgVol > threshold) return 1;
    return 0;
  }

  // Poll the analyser node to determine if speaking
  // and emit events if changed
  var looper = function() {
    setTimeout(function() { 

      //check if stop has been called
      if(!running) {
        return;
      }

      const currentVolume = getMaxVolume(analyser, fftBins);
      const aboveThreshold = frequencyAnalyser([85, 255], frequencySpread, fftBins)

      harker.emit('volume_change', currentVolume, threshold);

      var timesAboveThreshold = 0;
      if (aboveThreshold && !harker.speaking) {
        for (var i = 0; i < harker.speakingHistory.length; i++) {
          timesAboveThreshold += harker.speakingHistory[i];
        }
        //Need to hit the threshold 5 times in order to be speaking.
        if (timesAboveThreshold >= 5) {
          harker.speaking = true;
          harker.emit('speaking')
        }
      } else if (!aboveThreshold && harker.speaking) {
        for (var i = 0; i < harker.speakingHistory.length; i++) {
          timesAboveThreshold += harker.speakingHistory[i];
        }
        if (timesAboveThreshold == 0) {
          harker.speaking = false;
          harker.emit('stopped_speaking');
        }
      }

      harker.speakingHistory.shift();
      harker.speakingHistory.push(0 + aboveThreshold);

      looper();
    }, interval);
  };
  looper();


  return harker;
}
