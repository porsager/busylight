var busylight = require('../lib')
  , colors = 'white rgb(255,0,0) green #0000FF yellow #000'.split(' ')
  , tones = 'OpenOffice Quiet Funky FairyTale KuandoTrain TelephoneNordic TelephoneOriginal TelephonePickMeUp Buzz'.split(' ')
;

var bl = busylight.get();

bl.on('disconnected', function(err) {
  console.log(err);
});

bl.on('connected', function(){

  if(!bl)
    return console.log('no busylight found');

  bl.defaults({
    volume: 1,
    color: 'yellow'
  });

  testLight();
  testRing();

  function testLight() {
    for(var i = 0; i <= colors.length; i++) {
      setTimeout(function(color){
        if(color)
          bl.light(color);
        else
          testBlink();
      }, 2000*i, colors[i]);
    }
  }

  function testRing(){
    for(var i = 0; i < tones.length; i++) {
      setTimeout(function(tone){
        bl.ring(tone);
      }, 4000*i, tones[i]);
    }
  }

  function testBlink() {
    var s = 4000;
    bl.blink();
    setTimeout(function(){
      bl.blink('red');
      setTimeout(function(){
        bl.blink(colors);
        setTimeout(function(){
          bl.blink(colors, 100);
          setTimeout(function(){
            testPulse();
          }, s);
        }, s);
      }, s);
    }, s);
  }

  function testPulse() {
    var s = 4000;

    bl.pulse();
    setTimeout(function(){
      bl.pulse('red');
      setTimeout(function(){
        bl.pulse(colors);
        setTimeout(function(){
          bl.pulse(colors, 100);
          setTimeout(function(){
            close();
          }, s);
        }, s);
      }, s);
    }, s);
  }

  function close() {
    bl.off();
    setTimeout(function(){
      bl.close();
    }, 4000);
  }
});