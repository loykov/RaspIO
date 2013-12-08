module.exports = (function(){
	var async = require('async');
	var gpio = require('pi-gpio');
	var piblaster = require('./pi-blaster.js');
    var PIN_DIGITAL = 1;
    var PIN_PWM = 2;
    
    var pins = {
		3:{
			"name":"GPIO 2 - SDA",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": false
		},
		5:{
			"name":"GPIO 3 - SCL",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": false
		},
		7:{
			"name":"GPIO 4 - GPCLKO",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": true
		},
		11:{
			"name":"GPIO 17",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": true,
			"pwm_pin": 17
		},
		12:{
			"name":"GPIO 18 - PCM_CLK",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": true
		},
		13:{
			"name":"GPIO 21 - PCM_DOUT",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": true
		},
		15:{
			"name":"GPIO 22",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": true
		},
		16:{
			"name":"GPIO 23",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": true
		},
		18:{
			"name":"GPIO 24",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": true
		},
		19:{
			"name":"GPIO 10 - MOSI",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": false
		},
		21:{
			"name":"GPIO 9 - MISO",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": false
		},
		22:{
			"name":"GPIO 25",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": true
		},
		23:{
			"name":"GPIO 11 - SCLK",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": false
		},
		24:{
			"name":"GPIO 8 - CE0",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": false
		},
		26:{
			"name":"GPIO 7 - CE1",
			"dir":"output",
			"on":false,
			"val":0,
			"pwm": false
		}
	};
	
	var init = function() {
		for(pin in pins) {
			pins[pin].pintype = PIN_DIGITAL; 
			if(pin % 2 == 0) {
				pins[pin].pos = "right";
				pins[pin].top = (pin-8)/2*33+119; //position for background
			} else {
				pins[pin].pos = "left";
				pins[pin].top = (pin-3)/2*33+52; //position for background
			}
			//pins[pin]["val"].on("change", pinChanged.apply(pins, [pin]));
		}
	};

	var pinChanged = function(pin){
		console.log(pin + "pin changed. value: " + this[pin]["val"]);
	};
	
	var changePinType = function(pin, type){
		
	};
	
	var initPins = function(inited) {
		async.forEach(Object.keys(pins), initPin.apply(pins, [pin, callback]), function() {
			inited.call();
		});
	};
	
	var initPin = function(pin, callback) {
		console.log("initPin running");
		if(!this[pin]["on"]){
			
			gpio.open(pin, this.pins[pin]["dir"], function(err, callback){
				//if(err) return console.error(err);
				this.pins[pin]["on"] = true;
				console.log("initPin complete");
				callback();
			});
		}
	};
	var closePin = function(pin, callback) {
		console.log("closePin running at pin: ",pin);
		if(this.pins[pin]["on"]){
			if(this.pins[pin]["dir"] == "output"){
				gpio.write(pin, 0, function(err){
					if(err) {
						console.log("ERROR: ",err," when try to set 0 the pin: ",pin);
						callback(err);
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
	};
	var closeOne = function(pin, callback) {
		console.log("closeOne pin: ", pin);
		//eval("this.closePin(pin, callback)");
		//pins.closePin(pin, callback);
		//return true;
		//console.dir(this);
		//pins.setPinDirection(11,2);
		callback();
	};
	var closeAll = function(afterClose) {
		//console.log("closeAll function");
		async.each(Object.keys(this.pins), closeOne.apply(this, [pin, callback])
			, function() {
			afterClose();
		});
	};
	
	var turnOnOff = function(pin, callback) {
		if(pins[pin]["on"] && pins[pin]["dir"] == "output"){
			if(pins[pin]["on"]["val"] == 0){
				gpio.write(pin, 1, function(err){
					pins[pin]["on"]["val"] = 1;
					callback();
				});
			} else {
				gpio.write(pin, 0, function(err){
					pins[pin]["on"]["val"] = 0;
					callback();
				});
			}
		}	
	};
	
	var setPinDirection = function(pin, direction) {
		console.log("setPinDirection");
	};
	
	/* options kötelező: pin, pin_value */
	var pwm = function(options, callback) {
		pins[options.pin]["val"] = options.pin_value;
		piblaster.setPwm(pins[options.pin]["pwm_pin"],options.pin_value);
		callback.call();
	};
	
	var releasePwm = function(pin, callback) {
		pins[pin]["val"] = 0;
		pins[pin]["on"] = false;
		piblaster.releasePwm(pin);
		if(callback !== undefined){
			callback();
		}
	};
	
	init();

    return {
        pins: pins,
        pwm: pwm,
        releasePwm: releasePwm,
        closePin: closePin 
    };
}());