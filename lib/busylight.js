var HID = require('node-hid')
  , hidFinder = require('./hidfinder')
  , supported = require('../supported.json')
  , events = require('events')
  , util = require('util')
  , degamma = require('./degamma')
  , pwmColor = require('pwmcolorparser')
  , Stepper = require('./stepper')
  , tones = {
    OpenOffice        : 136,
    Quiet             : 144,
    Funky             : 152,
    FairyTale         : 160,
    KuandoTrain       : 168,
    TelephoneNordic   : 176,
    TelephoneOriginal : 184,
    TelephonePickMeUp : 192,
    Buzz              : 216
  },
  positions = {
    red   : 3,
    green : 4,
    blue  : 5,
    sound : 8
  }
;

function tweenRGB(start, end, value) {
  return [
    Math.floor(start[0] + (end[0] - start[0]) * value),
    Math.floor(start[1] + (end[1] - start[1]) * value),
    Math.floor(start[2] + (end[2] - start[2]) * value)
  ];
}

function getRGB(color) {
  return pwmColor.parseColor(color);
}

function Busylight(options){
  events.EventEmitter.call(this);
  this.options = options || supported;
  this.buffer = [0,0,0,0,0,0,0,0,128];
  this.newProtocol = options.vendorId = 10171
  this.debug = false;
  this.connectAttempts = 0;
  this.getColorArray = function(colors) {
    if(!Array.isArray(colors))
      colors = [ colors ? getRGB(colors) : this._defaults.color, [0,0,0]];
    else
      colors = colors.map(function(color) { return getRGB(color); });

    if(colors.length == 1)
      colors.push([0,0,0]);

    return colors;
  };

  if (this.newProtocol) {
    this.buffer[1] = 16;
    for (var i = 0; i < 50; i++)
      this.buffer.push(0);
    this.buffer = this.buffer.concat([255, 255, 255, 255, 6, 147]);
  }

  this._defaults = {
    keepalive: true,
    color: [255,255,255],
    rate: 300,
    degamma: true,
    tone: 'OpenOffice',
    volume: 4
  };

  process.nextTick(this.connect.bind(this));
}

util.inherits(Busylight, events.EventEmitter);

Busylight.prototype.connect = function(options) {
  if(!options && this.connected)
    return;

  if(this.debug)
    console.log('Connecting '+this.connectAttempts);

  if(options)
    this.options = options;

  var device = hidFinder.get(this.options);

  if(!device || !device.path) {
    this.connected = false;
    this.connectAttempts++;
    this.emit('disconnected', new Error('Device not found'));
    if(this.reconnectTimer)
      clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(this.connect.bind(this), ~~Math.pow(1000, (this.connectAttempts > 15 ? 15 : this.connectAttempts) / 10));
    return;
  }

  try {
    this.device = new HID.HID(device.path);
  } catch(e) {
    this.emit('disconnected', e);
    return;
  }

  if(!this.device)
    return;

  if(this.debug)
    console.log('Connected');

  this.connected = true;
  this.connectAttempts = 0;
  this.emit('connected');
  this.device.on('error', function(err){
    this.connected = false;
    this.connect();
  }.bind(this));
};

Busylight.prototype.defaults = function(options){
  for(var key in options) {
    if(this._defaults[key])
      this._defaults[key] = key == 'color' ? getRGB(options[key]) : options[key];
  }

  return(this._defaults);
};

Busylight.prototype.close = function(){
  this.device.close();
};

Busylight.prototype.off = function(){
  if(this.stepper)
    this.stepper.stop();
  this.send({
    color: [0,0,0],
    tone: false,
    volume: 0
  });
};

Busylight.prototype.send = function(p){
  if(!this.connected) {
    setTimeout(this.send.bind(this, p), 50);
    return;
  }

  if(!this.device) {
    if(this.debug)
      console.log('No device defined');
    return;
  }

  if(p && p.color !== undefined) {
    p.color = p.color || this._defaults.color;
    this.buffer[positions.red] = degamma(p.color[0]);
    this.buffer[positions.green] = degamma(p.color[1]);
    this.buffer[positions.blue] = degamma(p.color[2]);
  }

  if(p && p.tone === false)
    this.buffer[positions.sound] = 128;
  else if(p && p.tone !== undefined)
    this.buffer[positions.sound] = (tones[p.tone] || this._defaults.tone) + (p.volume);

  if(this.debug)
    console.info('Writing buffer: '+ this.buffer);

  var checksum
  if (this.newProtocol) {
    checksum = this.buffer.slice(0, 63).reduce(function(a, b) { return a + b })
    this.buffer[63] = (checksum >> 8) & 0xffff
    this.buffer[64] = checksum % 256
  }

  try {
    this.device.write(this.buffer);
  } catch(e) {
    this.connected = false;
    this.connect();
    return;
  }

  if(this._defaults.keepalive) {
    if(this.keepAliveTimer)
      clearTimeout(this.keepAliveTimer);
    this.keepAliveTimer = setTimeout(function(){
      this.send();
    }.bind(this), 20000);
    this.keepAliveTimer.unref();
  }
};

Busylight.prototype.ring = function(tone, volume){
  this.send({
    tone: false
  });

  if(tone === false)
    return this;

  this.send({
    tone: tone || this._defaults.tone,
    volume: volume || this._defaults.volume
  });

  return this;
};

Busylight.prototype.light = function(color){
  if(this.stepper)
    this.stepper.stop();

  this.send({
    color: color === false ? [0,0,0] : (color ? getRGB(color) : this._defaults.color)
  });

  return this;
};

Busylight.prototype.blink = function(colors, rate){
  if(this.stepper)
    this.stepper.stop();

  if(colors === false) {
    this.light(false);
    return this;
  }

  colors = this.getColorArray(colors);

  rate = rate || this._defaults.rate;

  this.stepper = new Stepper(colors.length, rate, function tick(index){
    this.send({ color: colors[index] });
  }.bind(this));

  return this;
};

Busylight.prototype.pulse = function(colors, rate){
  var refreshRate = 10
    , ticks
  ;

  if(this.stepper)
    this.stepper.stop();

  if(colors === false) {
    this.light(false);
    return this;
  }

  colors = this.getColorArray(colors);

  rate = rate || this._defaults.rate;
  ticks = colors.length * rate / refreshRate;

  this.stepper = new Stepper(ticks, refreshRate, function tick(index){
    var colorIndex = Math.floor(index / rate * refreshRate)
      , start = colors[colorIndex] || this._defaults.color
      , end = colors[colorIndex < colors.length - 1 ? colorIndex + 1 : 0 ] || this._defaults.color
    ;

    this.send({ color: tweenRGB(start, end, 1/(rate/refreshRate) * (index % (rate/refreshRate))) });
  }.bind(this));

  return this;
};

module.exports = Busylight;
