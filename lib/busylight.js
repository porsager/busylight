var degamma = require('./degamma')
  , cssColor = require('csscolorparser')
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
  return cssColor.parseCSSColor(color);
}

function Busylight(device){
  this.device = device;
  this.buffer = [0,0,0,0,0,0,0,0,128];
  this.debug = false;
  this.getColorArray = function(colors) {
    if(!Array.isArray(colors))
      colors = [ colors ? getRGB(colors) : this._defaults.color, [0,0,0]];
    else
      colors = colors.map(function(color) { return getRGB(color); });

    if(colors.length == 1)
      colors.push([0,0,0]);

    return colors;
  };

  this._defaults = {
    keepalive: true,
    color: [255,255,255],
    rate: 300,
    degamma: true,
    tone: 'OpenOffice',
    volume: 4
  };
}

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
  var self = this;

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

  this.device.write(this.buffer);

  if(this._defaults.keepalive) {
    if(this.keepAliveTimer)
      clearTimeout(this.keepAliveTimer);
    this.keepAliveTimer = setTimeout(function(){
      self.send();
    }, 29000);
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