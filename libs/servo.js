module.exports = (function(){
	var pins = require('./gpio-pins2.js');
	
	var servo_hovering = false;
	var servo_angle = true;
	
	var servo_pin = 22;
	var servo_MIN = 0.07;
	var servo_MAX = 0.245;
	var servo_state = servo_MIN;
	
	var servos = {
		1: {
			"servo_pin":22,
			"servo_state":servo_MIN,
			"servo_hovering": false,
			"servo_angle": true
		},
		2: {
			"servo_pin":12,
			"servo_state":servo_MIN,
			"servo_hovering": false,
			"servo_angle": true
		}
	};
	
	new Array(22,12);
	
	var servoHover = function(data) {
		if(data.on){
			servos[data.motor]["servo_hovering"] = true;
			servoHoverStep(data);
			/*
			if (data.speed <= 5) {
				data.stepsize = parseInt(data.stepsize/data.speed,10);
			}
			*/
			
		} else {
			servos[data.motor]["servo_hovering"] = false;
		}
	};
	
	var servoHoverStep = function(data) {
		if(servos[data.motor]["servo_hovering"]){
			if(servos[data.motor]["servo_angle"]){
			//felfelé megyünk
				if(servos[data.motor]["servo_state"] <= servo_MAX-data.step){
				//ha növelni kell
					servos[data.motor]["servo_state"] += data.step;
				} else {
					servos[data.motor]["servo_state"] = servo_MAX;
					servos[data.motor]["servo_angle"] = !servos[data.motor]["servo_angle"];
				}
			} else {
			// lefelé megyünk
				if(servos[data.motor]["servo_state"] >= servo_MIN+data.step) {
					servos[data.motor]["servo_state"] -= data.step;
				} else {
					servos[data.motor]["servo_state"] = servo_MIN;
					servos[data.motor]["servo_angle"] = !servos[data.motor]["servo_angle"];
				}
				
			}
			pins.pwm({pin:servos[data.motor]["servo_pin"],pin_value:servos[data.motor]["servo_state"]},function() {
				setTimeout(function() {
					servoHoverStep(data);
				}, data.speed);
			});
		}
	}
	
	var setServoAngle = function(motor,angle,callback){
		angle = Math.abs(angle);
		if(angle<0 || angle>360) { callback.call(); return false; }
		var pin_value;
		if(angle == 0){ 
			pin_value = servo_MIN; 
		} else if (angle == 360){ 
			pin_value = servo_MAX;
		} else {
			pin_value = (0.0005*angle)+servo_MIN;	
		}
		//console.log("pin_value:"+pin_value);
		//current_angle = servos[data.motor]["servo_state"];
		//current_angle = current_angle;
		pins.pwm({pin:servos[motor]["servo_pin"],pin_value:pin_value},function() {
			servos[motor]["servo_state"] = pin_value;
			callback.call();
			delete pin_value;
		});
	}
	
	var setServoByJoystick = function(mov_X,mov_Y){
		//console.log(mov_X,mov_Y);
		if(Math.abs(mov_X) > 180) {
			if (mov_X > 0){
				mov_X = 180;
			} else {
				mov_X = -180;
			}
		}
		if(Math.abs(mov_Y) > 180) {
			if (mov_Y > 0){
				mov_Y = 180;
			} else {
				mov_Y = -180;
			}
		}
		mov_X += 180;
		mov_Y += 180;
		//mov_Y = 360/(mov_Y/180)+1;
		//console.log("joystick:");
		console.log("X",mov_X,mov_Y);
		setServoAngle(1,parseInt(mov_Y, 10),function() {});
		setServoAngle(2,parseInt(mov_X, 10),function() {});
		return {
			mov_A:mov_X,
			mov_B:mov_Y
		};
	}
	
	return {
    	servoHover: servoHover,
    	setServoAngle: setServoAngle,
    	setServoByJoystick: setServoByJoystick
    };
}());