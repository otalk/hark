# Hark

### Warning: This is a work in progress

Hark is a tiny browser/commonJS module that listens to an audio stream, and emits events indicating whether the user is speaking or not.

## Usage:

`npm install hark`

If you aren't using browserify, you'll want hark.bundle.js.

```javascript
  var hark = require('../hark.js')

  var getUserMedia = require('getusermedia')

  getUserMedia(function(err, stream) {
    if (err) throw err

    var speechEvents = hark(stream);

    speechEvents.on('speaking', function() {
      console.log('speaking');
    });

    speechEvents.on('stopped_speaking', function() {
      console.log('stopped_speaking');
    });
  });
```

## Demo:

Clone and open example/index.html

## Requirements:
 
Chrome with webrtc audio input flag enabled

## License

MIT

