function Stepper(steps, rate, step){
  var index = 0;

  if(steps === false)
    return;

  this.timer = setInterval(function(){
    if(steps !== null && index >= steps)
      index = 0;

    step(index);
    index++;
  }.bind(this), rate);
}

Stepper.prototype.stop = function(){
  clearInterval(this.timer);
};

module.exports = Stepper;