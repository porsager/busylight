# 🚨 Busylight for node
A node library for the Busylight usb device.
More info on the Busylight can be found here: http://busylight.com/

## Install

    npm install busylight
[*extra steps for node-webkit](#node-webkit)

# Quick start
### Get a Busylight

    var busylight = require('busylight').get()

### Make it dance

    busylight.ring().pulse();
    
### STOP!

    busylight.off();
    
### Hammertime...
    busylight.ring('Funky').blink(['red', 'yellow', 'blue', 'green'], 150);
    
# Usage
### Finding an attached busylight
Get the first available busylight

    var busylight = require('busylight').get()

Get a specific Busylight attached to the system.

    var busylight = require('busylight').get(path);

The path can be found by looking at the connected Busylights. 
Pass true if you want to see all connected USB HIDs. This can be useful if the Busylight is not detected.

    var busylights = require('busylight').devices(showAllUSBDevices);

### Defaults method
Set up different defaults that the busyligt will use if you don't give specific instructions

    busylight.defaults({
      keepalive: true,      // If the busylight is not kept alive it will turn off after 30 seconds
      color: 'white',       // The default color to use for light, blink and pulse
      duration: 30 * 1000,  // The duration for a blink or pulse sequence
      rate: 300,            // The rate at which to blink or pulse
      degamma: true,        // Fix rgb colors to present a better light
      tone: 'OpenOffice',   // Default ring tone
      volume: 4             // Default volume
    });

### light(color)
To make the busylight light a specific color just use a valid css color.

    busylight.light('orange')

To turn it off

    busylight.light(false);

### ring(tone, volume)
Make the busylight play a ringtone

    busylight.ring('OpenOffice')

Volumesteps
The busylight accepts volume values of 0-7

Ringtones
* OpenOffice
* Quiet
* Funky
* FairyTale
* KuandoTrain
* TelephoneNordic
* TelephoneOriginal
* TelephonePickMeUp
* Buzz    (Basically annoying white noise)

### blink(colors, rate)
Fades smoothly between colors. If only a single color is defined it will pulse between that color and no light

    busylight.blink(['red', 'green', 'blue'], 500);

### pulse(colors, rate)
The pulse method fades smoothly between the defined colors. If only a single color is defined it will pulse between that color and no light

    busylight.pulse(['#f00', '#0f0', '#00f']);

### off()
Turns everything off.
    
    busylight.off();

### close()
When you are done using the busylight you can use the close method to shut down the connection correctly
    
    busylight.close();

### Chaining
Simple chaining is available to let you eg. ring and blink in one go

    busylight.ring().blink();

Turn it off again

    busylight.ring(false).blink(false);

# Supports
Currently only the Kuando Busylight has been tested, but it seems the busylight unit is available under different names
* Kuando Busylight

### <a name="node-webkit"></a>Node-webkit
Busylight relies on node-hid. node-hid needs to be built for each platform and specific version of node-webkit, so to make it work you need to build node-hid using nw-gyp
https://github.com/rogerwang/node-webkit/wiki/Build-native-modules-with-nw-gyp
