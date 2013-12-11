/* TEST FILE */

var async = require('async');
var gpio = require('pi-gpio');

module.exports = {
	pins: {
		3:{
			"name":"GPIO 2 - SDA",
			"dir":"output",
			"on":false,
			"val":0
		},
		5:{
			"name":"GPIO 3 - SCL",
			"dir":"output",
			"on":false,
			"val":0
		},
		7:{
			"name":"GPIO 4 - GPCLKO",
			"dir":"output",
			"on":false,
			"val":0
		},
		11:{
			"name":"GPIO 17",
			"dir":"output",
			"on":false,
			"val":0
		},
		12:{
			"name":"GPIO 18 - PCM_CLK",
			"dir":"output",
			"on":false,
			"val":0
		},
		13:{
			"name":"GPIO 27 - PCM_DOUT",
			"dir":"output",
			"on":false,
			"val":0
		},
		15:{
			"name":"GPIO 22",
			"dir":"output",
			"on":false,
			"val":0
		},
		16:{
			"name":"GPIO 23",
			"dir":"output",
			"on":false,
			"val":0
		},
		18:{
			"name":"GPIO 24",
			"dir":"output",
			"on":false,
			"val":0
		},
		19:{
			"name":"GPIO 10 - MOSI",
			"dir":"output",
			"on":false,
			"val":0
		},
		21:{
			"name":"GPIO 9 - MISO",
			"dir":"output",
			"on":false,
			"val":0
		},
		22:{
			"name":"GPIO 25",
			"dir":"output",
			"on":false,
			"val":0
		},
		23:{
			"name":"GPIO 11 - SCLK",
			"dir":"output",
			"on":false,
			"val":0
		},
		24:{
			"name":"GPIO 8 - CE0",
			"dir":"output",
			"on":false,
			"val":0
		},
		26:{
			"name":"GPIO 7 - CE1",
			"dir":"output",
			"on":false,
			"val":0
		}
	},
	init: function() {
		for(pin in this.pins) {
			if(pin % 2 == 0) {
				this.pins[pin].pos = "right";
				this.pins[pin].top = (pin-8)/2*33+119; //position for background
			} else {
				this.pins[pin].pos = "left";
				this.pins[pin].top = (pin-3)/2*33+52; //position for background
			}
		}
	},
	initPins: function(callback) {
		async.forEach(Object.keys(this.pins), this.initPin, function() {
			callback();
		});
	},
	initPin: function(pin, callback) {
		console.log("initPin running");
		if(!this.pins[pin]["on"]){
			gpio.open(pin, this.pins[pin]["dir"], function(err, callback){
				//if(err) return console.error(err);
				this.pins[pin]["on"] = true;
				console.log("initPin complete");
				callback();
			});
		}
	},
	closePin: function(pin, callback) {
		console.log("closePin running at pin: ",pin);
		if(this.pins[pin]["on"]){
			if(this.pins[pin]["dir"] == "output"){
				gpio.write(pin, 0, function(err){
					if(err) {
						console.log("ERROR: ",err," when try to set 0 the pin: ",pin);
						return false;
					}
					this.pins[pin]["val"] = 0;
					console.log("Pin " + pin + " Set value: 0");
					console.log("Pin closed: "+pin);
					this.pins[pin]["on"] = false;
					gpio.close(pin,callback);
				});
			} else {
				console.log("Pin closed: "+pin);
				this.pins[pin]["on"] = false;
				gpio.close(pin,callback);				
			}
		} else {
			callback();
		}
	},
	closeOne: function(pin, callback) {
		//console.log("close pin: ", pin);
		pins.closePin(pin, callback);
		callback();
	},
	closeAll: function(callback) {
		//console.log("closeAll function");
		async.forEach(Object.keys(this.pins), this.closeOne, function() {
			callback();
		});
	},
	turnOnOff: function(pin, callback) {
		if(this.pins[pin]["on"] && this.pins[pin]["dir"] == "output"){
			if(this.pins[pin]["on"]["val"] == 0){
				gpio.write(pin, 1, function(err){
					this.pins[pin]["on"]["val"] = 1;
					callback();
				});
			} else {
				gpio.write(pin, 0, function(err){
					this.pins[pin]["on"]["val"] = 0;
					callback();
				});
			}
		}	
	},
	setPinDirection: function(pin, direction) {
		
	}
}