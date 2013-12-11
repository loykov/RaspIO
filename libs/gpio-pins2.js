module.exports = (function(){
	var async = require('async');
	var gpio = require('pi-gpio');
	var piblaster = require('./pi-blaster.js');
    var PIN_DIGITAL = 1;
    var PIN_PWM = 2;
    
    var pins = {
		3:{
			"name":"GPIO 2 - SDA",
			"pwm": false
		},
		5:{
			"name":"GPIO 3 - SCL",
			"pwm": false
		},
		7:{
			"name":"GPIO 4 - GPCLKO",
			"pwm": true,
			"pwm_pin": 4
		},
		11:{
			"name":"GPIO 17",
			"pwm": true,
			"pwm_pin": 17
		},
		12:{
			"name":"GPIO 18 - PCM_CLK",
			"pwm": true,
			"pwm_pin": 18
		},
		13:{
			"name":"GPIO 21 - PCM_DOUT",
			"pwm": true,
			"pwm_pin": 21
		},
		15:{
			"name":"GPIO 22",
			"pwm": true,
			"pwm_pin": 22
		},
		16:{
			"name":"GPIO 23",
			"pwm": true,
			"pwm_pin": 23
		},
		18:{
			"name":"GPIO 24",
			"pwm": true,
			"pwm_pin": 24
		},
		19:{
			"name":"GPIO 10 - MOSI",
			"pwm": false
		},
		21:{
			"name":"GPIO 9 - MISO",
			"pwm": false
		},
		22:{
			"name":"GPIO 25",
			"pwm": true,
			"pwm_pin": 25
		},
		23:{
			"name":"GPIO 11 - SCLK",
			"pwm": false
		},
		24:{
			"name":"GPIO 8 - CE0",
			"pwm": false
		},
		26:{
			"name":"GPIO 7 - CE1",
			"pwm": false
		}
	};
	
	var init = function() {
		for(pin in pins) {
			pins[pin].pinmode 	= PIN_DIGITAL;
			pins[pin].dir 		= 'input';
			pins[pin].on 		= false;
			pins[pin].val 		= 0;
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
	
	var changePinMode = function(pin, type, callback){
		if (type == PIN_DIGITAL || type == PIN_PWM){
			if (pins[pin]['pinmode'] != type) {
				closePin(pin, function() {
					pins[pin]['pinmode'] = type;
					callback();
				});
			} else {
				pins[pin]['pinmode'] = type;
				callback();
			}
		} else {
			callback(false);
		}
	};
	
	var initPins = function(inited) {
		async.forEach(Object.keys(pins), initPin, function() {
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
		} else {
			callback();
		}
	};
	var closePin = function(pin, callback) {
		console.log("closePin running at pin: ",pin);
		if(pins[pin]["on"]){
			if(pins[pin]['pinmode'] == PIN_DIGITAL){
				if(pins[pin]["dir"] == "output"){
					gpio.write(pin, 0, function(err){
						if(err) {
							console.log("ERROR: ",err," when try to set 0 the pin: ",pin);
							callback(err);
							return false;
						}
						pins[pin]["val"] = 0;
						console.log("Pin " + pin + " Set value: 0");
						gpio.close(pin,function() {
							console.log("Pin closed: "+pin);
							pins[pin]["on"] = false;
							callback();
						});
					});
				} else {
					gpio.close(pin,function() { 
						console.log("Pin closed: "+pin);
						pins[pin]["on"] = false;
						callback();
					});				
				}
			} else if (pins[pin]['pinmode'] == PIN_PWM) {
				pwm({pin:pin,pin_value:0},function() {
					pins[pin]["val"] = 0;
					releasePwm(pin, function() {
						pins[pin]["on"] = false;
						callback();
					});
				});
			}
		} else {
			console.log(pin+" already closed!");
			callback();
		}
	};
	var closeOne = function(pin, callback) {
		console.log("closeOne pin: ", pin);
		//eval("this.closePin(pin, callback)");
		closePin(pin,callback);
		//return true;
		//console.dir(this);
		//pins.setPinDirection(11,2);
		//callback();
	};
	var closeAll = function(afterClose) {
		//console.log("closeAll function");
		async.each(Object.keys(this.pins), closeOne, function() {
			afterClose();
		});
		/*
		async.forEach(Object.keys(this.pins), closeOne.apply(this, [pin, this.callback])
			, function() {
			afterClose();
		});
		*/
	};
	
	var turnOnOff = function(pin, callback) {
		if(pins[pin]['on'] && pins[pin]['pinmode'] == PIN_DIGITAL && pins[pin]['dir'] == 'output'){
			gpio.write(pin, 1-pins[pin]['val'], function(err){
				pins[pin]['val'] = 1-pins[pin]['val'];
				callback();
			});
		} else {
			callback(false);
		}
	};
	
	var setPinDirection = function(pin, direction) {
		console.log("setPinDirection");
	};
	
	/* options kötelező: pin, pin_value */
	var pwm = function(options, callback) {
		pins[options.pin]['val'] = options.pin_value;
		piblaster.setPwm(pins[options.pin]['pwm_pin'],options.pin_value);
		callback.call();
	};
	
	var releasePwm = function(pin, callback) {
		pins[pin]['val'] = 0;
		pins[pin]['on'] = false;
		piblaster.releasePwm(pin);
		if(typeof callback !== undefined){
			callback();
		}
	};
	
	init();

    return {
        pins: pins,
        pwm: pwm,
        releasePwm: releasePwm,
        closePin: closePin,
        closeAll: closeAll,
        turnOnOff: turnOnOff
    };
}());