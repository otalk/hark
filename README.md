# Hark

Hark is a tiny browser/commonJS module that listens to an audio stream, and emits events indicating whether the user is speaking or not.

With browserify:

`npm install hark`

Without browserify download and use:

[hark.bundle.js](https://raw.github.com/latentflip/hark/master/hark.bundle.js)


## Example:

`npm install hark`

If you aren't using browserify, you'll want hark.bundle.js.

```javascript
  var hark = require('../hark.js')

  var getUserMedia = require('getusermedia')

  getUserMedia(function(err, stream) {
    if (err) throw err

    var options = {};
    var speechEvents = hark(stream, options);

    speechEvents.on('speaking', function() {
      console.log('speaking');
    });

    speechEvents.on('stopped_speaking', function() {
      console.log('stopped_speaking');
    });
  });
```

## How does hark work?

Hark uses the webaudio API to FFT (get the power of) the audio in the audio stream. If the power is above a threshold, it's determined to be speech.


## Usage

```javascript
var speech = hark(stream, options);
speech.on('speaking', function() {
  console.log('Speaking!');
});
```

* Pass hark either a webrtc stream which has audio enabled, or an audio element, and an optional options hash (see below for options).
* hark returns an event emitter with the following events:
  * `speaking` emitted when the stream appears to be speaking
  * `stopped_speaking` emitted when the audio doesn't seem to be speaking
  * `current_volume` emitted on every poll event by the event emitter with the current volume (in decibels) and the current threshold for speech
* The hark object also has the following methods to update the config of hark. Both of these options can be passed in on instantiation, but you may wish to alter them either for debug or fine tuning as your app runs.
  * `setInterval(interval_in_ms)` change 
  * `setThreshold(threshold_in_db)` change the minimum volume at which the audio will emit a `speaking` event

## Options

* `interval` (optional, default 100ms) how frequently the analyser polls the audio stream to check if speaking has started or stopped. This will also be the frequency of the `volume_change` events.
* `threshold` (optional, default -65db for audio tags, -45db for rtc streams)  the volume at which `speaking`/`stopped\_speaking` events will be fired
* `play` (optional, default true for audio tags, false for webrtc streams) whether the audio stream should also be piped to the speakers, or just swallowed by the analyser. Typically for audio tags you would want to hear them, but for microphone based webrtc streams you may not to avoid feedback.

## Understanding dB/volume threshold

Fine tuning the volume threshold is the main configuration setting for how this module will behave. The levels of -65db and -45db for audio tags and rtc streams respectively have been chosen based on some basic experimentation on mysetup, but you may wish to change them (and should if it improves your app).

**What is dB?** Decibels are how sound is measured. The loudest sounds on your system will be at 0dB, and silence in webaudio is -100dB. Speech seems to be between roughly -65dB and -45dB depending on the volume and type of source. If speaking events are being fired too frequently, you would make this number higher (i.e. towards 0). If they are not firing frequently enough (you are speaking loudly but no events are firing), make the number closer to -100dB).


## Demo:

Clone and open example/index.html or [view it online](http://latentflip.com/hark/example)


## Requirements:
 
Chrome 27+ currently

## License

MIT

