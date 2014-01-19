var Busylight = require('./busylight')
  , hidfinder = require('./hidfinder')
  , supported = require('../supported.json')
;

module.exports.devices = function(findUnsupported){
  return hidfinder.devices(findUnsupported ? {} : supported);
};

module.exports.get = function get(options) {
  var device = hidfinder.get(options || supported);

  if(!device)
    return null;

  return new Busylight(device);
};