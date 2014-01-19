var HID = require('node-hid');

function where(array, options) {
  return array.filter(function(object) {
    for (var key in options) {
      if (options[key] !== object[key])
        return false;
    }
    return true;
  });
}

module.exports.devices = function (devices) {
  var foundDevices = [];

  if(!Array.isArray(devices))
    devices = [devices];

  devices.forEach(function(device){
    foundDevices = foundDevices.concat(where(HID.devices(), device));
  });

  return foundDevices;
};

module.exports.get = function (options) {
  var devices = module.exports.devices(options);

  if(devices.length === 0)
    return null;

  return new HID.HID(devices[0].path);
};