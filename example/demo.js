var hark = require('../hark.js')
var log = require('bows')('Demo');

var getUserMedia = require('getusermedia')

getUserMedia(function(err, stream) {
  if (err) throw err

  var speechEvents = hark(stream);

  speechEvents.on('speaking', function() {
    document.write('Speaking<br>');
    log('speaking');
  });

  speechEvents.on('stopped_speaking', function() {
    document.write('Not Speaking<br>');
    log('stopped_speaking');
  });
});
