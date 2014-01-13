module.exports = (function(){
	var async = require('async');
	var gpio = require('pi-gpio');
	var piblaster = require('./pi-blaster.js');
    var PIN_DIGITAL = 1;
    var PIN_PWM = 2;
    
    var pins = {
    	1:{
    		"name":"3.3V",
    		"pwm": false,
    		"inactive": true,
    		"color": "yellow"
    	},
    	2:{
    		"name":"5V",
    		"pwm": false,
    		"inactive": true,
    		"color": "red" 
    	},
		3:{
			"name":"GPIO 2 - SDA",
			"pwm": false,
			"color": "lightgreen"
		},
		4:{
			"name":"5V",
			"pwm": false,
			"inactive": true,
			"color": "red"
		},
		5:{
			"name":"GPIO 3 - SCL",
			"pwm": false,
			"color": "lightgreen"
		},
		6:{
			"name":"GND",
			"pwm": false,
			"inactive": true,
			"color": "black"
		},
		7:{
			"name":"GPIO 4 - GPCLKO",
			"pwm": true,
			"pwm_pin": 4,
			"color": "orange"
		},
		9:{
			"name":"GND",
			"pwm": false,
			"inactive": true,
			"color": "black"
		},
		11:{
			"name":"GPIO 17",
			"pwm": true,
			"pwm_pin": 17,
			"color": "purple"
		},
		12:{
			"name":"GPIO 18 - PCM_CLK",
			"pwm": true,
			"pwm_pin": 18,
			"color": "lightgreen"
		},
		13:{
			"name":"GPIO 21 - PCM_DOUT",
			"pwm": true,
			"pwm_pin": 21,
			"color": "lightgreen"
		},
		14:{
			"name":"GND",
			"pwm": false,
			"inactive": true,
			"color": "black"
		},
		15:{
			"name":"GPIO 22",
			"pwm": true,
			"pwm_pin": 22,
			"color": "brown"
		},
		16:{
			"name":"GPIO 23",
			"pwm": true,
			"pwm_pin": 23,
			"color": "blue"
		},
		17:{
			"name":"3.3V",
			"pwm": false,
			"inactive": true,
			"color": "yellow" 
		},
		18:{
			"name":"GPIO 24",
			"pwm": true,
			"pwm_pin": 24,
			"color": "green"
		},
		19:{
			"name":"GPIO 10 - MOSI",
			"pwm": false,
			"color": "lightgreen"
		},
		20:{
			"name":"GND",
			"pwm": false,
			"inactive": true,
			"color": "black"
		},
		21:{
			"name":"GPIO 9 - MISO",
			"pwm": false,
			"color": "lightgreen"
		},
		22:{
			"name":"GPIO 25",
			"pwm": true,
			"pwm_pin": 25,
			"color": "lightgreen"
		},
		23:{
			"name":"GPIO 11 - SCLK",
			"pwm": false,
			"color": "lightgreen"
		},
		24:{
			"name":"GPIO 8 - CE0",
			"pwm": false,
			"color": "lightgreen"
		},
		25:{
			"name":"GND",
			"pwm": false,
			"inactive": true,
			"color": "black"
		},
		26:{
			"name":"GPIO 7 - CE1",
			"pwm": false,
			"color": "lightgreen"
		}
	};
	
	var init = function() {
		for(pin in pins) {
			if(typeof pins[pin].inactive === undefined){
				pins[pin].inactive = false;
			}
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
		if(!this.pins[pin]["on"]){
			
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
	
	var openPin = function(pin, callback) {
		if(!pins[pin]["on"] && pins[pin]["pinmode"]==PIN_DIGITAL){
			gpio.open(pin, pins[pin]["dir"], function(err){
				//if(err) return console.error(err);
				pins[pin]["on"] = true;
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
						console.log("PWM Pin closed: "+pin);
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
		closePin(pin,callback);
		//console.log("closeOne pin: ", pin);
		//eval("this.closePin(pin, callback)");
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
	
	var setPinDirection = function(pin, direction, callback) {
		closeOne(pin, function() {
			pins[pin]['dir'] = direction;
			if (typeof callback === "function"){
				callback();
			}
		});
		console.log("setPinDirection");
	};
	
	var setPinMode = function(pin, pin_mode, callback) {
		closeOne(pin, function() {
			pins[pin]['pinmode'] = parseInt(pin_mode, 10);
			if (typeof callback === "function"){
				callback();
			}
		});
		console.log("setPinMode");
	};
	
	/* set digital pin LOW or HIGH, false or true */
	var setPin = function(pin, value, callback) {
		if(value == "HIGH" || value == true || value == 1){
			value = 1;
		} else {
			value = 0;	
		}
		//console.log('setPin',pin,value);
		gpio.write(pin, value, function(err){
			pins[pin]['val'] = value;
			callback();
		});
	};
	
	var digitalPulse = function(pin, value, timems) {
		pwm({pin:pin,pin_value:value},function() {
			setTimeout(function() {
				pwm({pin:pin,pin_value:0},function() {});
			}, 1);
		});
	}
	
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
	
	/* controlling */
	var step_number;
	var current_step;
	var stepper_motor_steps = new Array(1,3,2,6,4,12,8,9);
	//var stepper_motor_steps = new Array(1,3,2,6,4,5);
	var motor_on = false;
	var step_speed = 50;
	var motor_speed;
	
	var startMotor = function() {
		motor_on = true;
		current_step = 0;
		motor_speed = 80;
		step_number = 0;
		setPinDirection(7,"output");
		setPinDirection(11,"output");
		setPinDirection(15,"output");
		setPinDirection(18,"output");
		openPin(7,function() {
			openPin(11,function() {
				openPin(18, function() {
					openPin(15, function() {
						repeat_steps();
					});
				});
			});
		});
	};
	
	var stopMotor = function() {
		motor_on = false;
	};
	
	var reverseMotor = function() {
		stepper_motor_steps.reverse();
	};
	
	var setMotorSpeed = function(speed) {
		motor_speed = parseInt(speed);
	};
	
	var repeat_steps = function() {
		if(motor_on){
			if(current_step==stepper_motor_steps.length-1){
				current_step = -1;
			}
			/*
			if(motor_speed > 50) {
				motor_speed -= 50;
			} else if (motor_speed > 10) {
				motor_speed -= 1;
			}*/
			current_step++;
			stepper_motor_step(current_step, function() {
				step_number++;
				setTimeout(repeat_steps, motor_speed);
			});
		}
	};
	
	var stepper_motor_step = function(step, callback) {
console.log(step_number,step,motor_speed,stepper_motor_steps[step]&1?1:0,stepper_motor_steps[step]&2?1:0,stepper_motor_steps[step]&4?1:0,stepper_motor_steps[step]&8?1:0);
		setPin(7,stepper_motor_steps[step]&1?true:false,function() {});
		setPin(11,stepper_motor_steps[step]&2?true:false,function() {});
		setPin(18,stepper_motor_steps[step]&4?true:false,function() {});
		setPin(15,stepper_motor_steps[step]&8?true:false,function() {callback();});
	};
	
	init();

    return {
        pins: pins,
        pwm: pwm,
        digitalPulse: digitalPulse,
        releasePwm: releasePwm,
        openPin: openPin,
        closePin: closePin,
        closeAll: closeAll,
        setPin: setPin,
        turnOnOff: turnOnOff,
        setPinMode: setPinMode,
        setPinDirection: setPinDirection,
        startMotor: startMotor,
        stopMotor: stopMotor,
        reverseMotor: reverseMotor,
        setMotorSpeed: setMotorSpeed
    };
}());