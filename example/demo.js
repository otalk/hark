var hark = require('../hark.js');
var bows = require('bows');

var iraVolumes = [];
var tagVolumes = [];
var streamVolumes = [];
var referenceVolumes = [];
for (var i = 0; i < 100; i++) {
  iraVolumes.push(-100);
  tagVolumes.push(-100);
  streamVolumes.push(-100);
  referenceVolumes.push(-50);
}

(function() {
  //Video Tag Demo
  var stream = document.querySelector('#ira video');
  var speechEvents = hark(stream);
  var notification = document.querySelector('#iraSpeaking');
  var log = bows('Video Demo');

  speechEvents.on('speaking', function() {
    log('speaking');
    notification.style.display = 'block';
  });

  speechEvents.on('volume_change', function(volume, threshold) {
    //log('volume change', volume, threshold);
    iraVolumes.push(volume);
    iraVolumes.shift();
  });

  speechEvents.on('stopped_speaking', function() {
    log('stopped_speaking');
    notification.style.display = 'none';
  });
})();


(function() {
  //Audio Tag Demo
  var stream = document.querySelector('audio');
  var speechEvents = hark(stream);
  var notification = document.querySelector('#mlkSpeaking');
  var log = bows('MLK Demo');

  speechEvents.on('speaking', function() {
    log('speaking');
    notification.style.display = 'block';
  });

  speechEvents.on('volume_change', function(volume, threshold) {
    //log('volume change', volume, threshold);
    tagVolumes.push(volume);
    tagVolumes.shift();
  });

  speechEvents.on('stopped_speaking', function() {
    log('stopped_speaking');
    notification.style.display = 'none';
  });
})();


(function() {
  //Microphone demo
  var getUserMedia = require('getusermedia');
  var attachmediastream = require('attachmediastream');
  var notification = document.querySelector('#userSpeaking');
  var log = bows('Microphone Demo');

  getUserMedia(function(err, stream) {
    if (err) throw err

    attachmediastream(stream, document.querySelector('#mic video'));
    var speechEvents = hark(stream);

    speechEvents.on('speaking', function() {
      notification.style.display = 'block';
      log('speaking');
    });

    speechEvents.on('volume_change', function(volume, threshold) {
      log(volume, threshold)
      streamVolumes.push(volume);
      streamVolumes.shift();
    });

    speechEvents.on('stopped_speaking', function() {
      notification.style.display = 'none';
      log('stopped_speaking');
    });
  });
})();

(function () {

  function drawLine(canvas, data, color) {
    var drawContext = canvas.getContext('2d');
    drawContext.moveTo(0,canvas.height);
    drawContext.beginPath();
    drawContext.strokeStyle = color;
    for (var i = 0; i < data.length; i++) {
      var value = -data[i];
      var percent = value / 100;
      var height = canvas.height * percent;
      var vOffset = height; //canvas.height - height - 5;
      var hOffset = i * canvas.width / 100.0;
      drawContext.lineTo(hOffset, vOffset);
    }
    drawContext.stroke();
  }
  function draw() {
    var canvas = document.querySelector('canvas');
    if (!canvas) return;
    var drawContext = canvas.getContext('2d');
    drawContext.clearRect (0, 0, canvas.width, canvas.height);

    drawLine(canvas, iraVolumes, 'red');
    drawLine(canvas, tagVolumes, 'green');
    drawLine(canvas, streamVolumes, 'blue');
    drawLine(canvas, referenceVolumes, 'black');
    window.requestAnimationFrame(draw);
  }
  window.requestAnimationFrame(draw);
})();
