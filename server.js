var Leap = require('leapjs');
var osc = require('osc-min');
var dgram = require('dgram');
var _ = require('lodash');

var LEAP_HOST = '10.42.0.33';
var OSC_PORT = 57120;

var udp = dgram.createSocket('udp4');

Leap.loop({host: LEAP_HOST, enableGestures: true}, _.throttle(function (frame) {
  if (!frame.valid) {
      return;
  }
  sendHand(frame.hands, 'left');
  sendHand(frame.hands, 'right');
}, 50));

function sendHand(hands, type) {
  var basePath = 'hands/'+type+'/'
  var hand = _.find(hands, {type: type});
  if (hand) {
    sendOscMessage(basePath + 'palmPosition', hand.palmPosition);

    var fingers = [
      hand.pinky,
      hand.ringFinger,
      hand.middleFinger,
      hand.indexFinger,
      hand.thumb,
    ];

    sendOscMessage(basePath + 'fingers/extended', fingers.map(function (finger) {
        if (finger) {
          return  finger.extended ? 1 : 0
        } else {
          return 0;
        }
    }));

    sendOscMessage(basePath + 'indexFinger/direction', hand.indexFinger.direction);
    sendOscMessage(basePath + 'middleFinger/direction', hand.middleFinger.direction);

    sendOscMessage(basePath + 'fingers/direction', _.flatten(_.map(fingers, 'direction')), true);
  }
}

function sendOscMessage(path, value, shouldLog) {
  if (shouldLog) {
    console.log('sendOscMessage', path, value);
  }
  var buf = osc.toBuffer({
    address: '/leap-motion/' + path,
    args: value
  });
  return udp.send(buf, 0, buf.length, OSC_PORT, "localhost");
};
