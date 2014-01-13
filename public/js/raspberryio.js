var site = {
	active_menu : "",
	templates: "template/",
	initSite: function(){
		console.log("initSite");
		this.$loading = $("#loading");
		$("header").load(this.templates+"header.html",this.initMenu);
		this.changeMenu("dashboard");
	},
	initMenu: function(){
		$(".menu").click(site.clickMenu);
		$("footer").load(site.templates+"footer.html",site.hideLoad);
	},
	clickMenu: function() {
		site.changeMenu($(this).attr('rel'));
	},
	changeMenu: function(menuname) {
		if (this.active_menu != menuname) {
			this.menuname = menuname;
			this.showLoad();
			$("#content").load(this.templates+menuname+".html",site.changeMenuSelected);
		}
	},
	changeMenuSelected: function() {
		$(".menu_"+site.active_menu).removeClass('active_menu');
		$(".menu_"+site.menuname).addClass('active_menu');
		site.hideLoad();
		site.active_menu = site.menuname;
		//run site action
		//console.log(site.siteActions[site.menuname]);
		site.siteActions[site.menuname].call(site);
	},
	showLoad: function(){
		site.$loading.show();
	},
	hideLoad: function(){
		site.$loading.fadeOut(100);
	},
	siteActions: {
		dashboard: function() {
			GPIOs.reDrawAll();
		},
		apps: function() {
			
		},
		led: function() {
			
		},
		motor: function() {
			$("#container").trigger('siteChange', ["motor"]);
		},
		joystick: function() {
			$("#container").trigger('siteChange', ["joystick"]);
		},
		video: function() {
		},
		calc: function() {
			var $calc = $("#calc");
			var methods = {
				sin: function (x,callback){
					
				}
			}
		},
		pwm: function(){
			$("#container").trigger('siteChange', ["pwm"]);
		}
	}
}

jQuery(function($){
	var socket = io.connect();
	var $consoleForm = $('#console-logger');
	var $consoleMsg = $('#console-msg');
	var $consoleBox = $('#console-messages');
	var pins;
	$consoleForm.submit(function(e) {
		e.preventDefault();
		socket.emit('send message', $consoleMsg.val());
		$consoleMsg.val('');
	});
	socket.on('new message', function(data){
		$consoleBox.append(data + "<br/>");
	});

	/* dashboard */
	socket.emit('init gpio', true);
	socket.on('init gpio data', function(gpio_data) {
		pins = gpio_data;
		GPIOs.init(pins);		
	});
	socket.on('gpioChanged', function(gpio_data) {
		pins[gpio_data.pin]=gpio_data.pin_data;
		GPIOs.reloadPin(gpio_data.pin, gpio_data.pin_data);
	});
	socket.on('changed gpio data', function(gpio_data) {
		console.log("changed gpio data");
		console.log(gpio_data);
		GPIOs.reDrawAll();
	});
	socket.on('sliderChanged', function(gpio_data){
		console.log('sliderChanged:',gpio_data);
		$('#slider'+gpio_data['pin']).val(gpio_data['pin_value']);
		$('#sliderValue'+gpio_data['pin']).val(gpio_data['pin_value']);
	});
	$("#content").on('click', '#close_all_gpio', function() {
		console.log("close all");
		socket.emit('close gpios', true);
	});
	$(document).on('gpioClicked',function(e) {
		//var pin = $(this).data('pin');
		//socket.emit("turnPinONOFF",e.pin);
		console.log("gpio click",e.pin);
		socket.emit("gpioChange",{pin:parseInt(e.pin,10),pin_mode:parseInt(e.pin_mode,10)});
	});
	$(document).on('gpioChange', '#container', function(event, pin, pin_prop, pin_val) {
		console.log(pin, pin_prop, pin_val);
	});
	$(document).on('closePin', '#container', function(event, pin) {
		console.log('closePin EVENT',pin);
		socket.emit('closePin',{pin:pin});
	});
	$(document).on('sliderChanged', '#container', function(event, pin, pin_value, slider_mode) {
		console.log('sliderChanger  pin: ',pin,"value",pin_value);
		$('#sliderValue'+pin).val(pin_value);
		socket.emit('changePwmPin',{pin_value:pin_value,pin:pin,slider_mode:slider_mode});
	});
	var drawPwmPin = function(pin, elem) {
		var $pwmPin = $("<div />");
		var $servoSwitch = $("<button />").addClass("servoSwitch").click(function() {
			$("#slider"+pin).attr("min", 0.06).attr("max", 0.24).attr("step", 0.0011).data("slider_mode",2);
		});
		$pwmPin.attr('id','pwmPin'+pin).addClass('pwmPin').data('pin',pin).html('<button class="pwmOnOff" data-state="'+pins[pin]["on"]+'">PIN '+pin+' - '+pins[pin]["name"]+'</button><br><input type="text" id="sliderValue'+pin+'" value="'+pins[pin]["val"]+'"><input type="range" id="slider'+pin+'" name="slider'+pin+'" class="pwm-slider" data-pin="'+pin+'" data-slider_mode="1" value="'+pins[pin]["val"]+'" min="0" max="1" step="0.001" width="95%" />');
		$pwmPin.append($servoSwitch);
		if (pins[pin]["on"]) {
			var $pwmClose = $("<div />");
			$pwmClose.addClass("bullet_delete");
			$pwmClose.click(function() {
				$("#pwmPin"+pin).remove();
				$("#container").trigger('closePin', [pin]);
			});
			$pwmPin.append($pwmClose);
		}
		if(typeof elem !== 'undefined'){
			$("#"+elem).append($pwmPin);
		} else {
			$("#pwmPins").append($pwmPin);
		}
		var $slider = $("#pwmPin"+pin+" .pwm-slider");
		$slider.change(function() {
			pin = $(this).data('pin');
			console.log("slided", $(this).val(), pin);
			var slider_mode = $(this).data("slider_mode");
			$("#container").trigger('sliderChanged', [pin,$(this).val(),slider_mode]);
		});
	};
	
	$(document).on('siteChange','#container',function(event, siteName){
		console.log("siteChange event",siteName);
		socket.emit('init gpio', true);
		if(siteName == "pwm") {
			var $pinSelect = $('#pinSelect');
			for (pin in pins) {
				if(pins[pin]["pwm"]) {
					if(!pins[pin]["on"]){
						$pinSelect.append('<option value="'+pin+'">PIN '+pin+' - '+pins[pin]["name"]+'</option>');
					} else if (pins[pin]["pinmode"] == 2) {
						drawPwmPin(pin);
					}
				}
			}
			$('.addPin').click(function(){
				var pin_number = $("#pinSelect option:selected").val();
				$("#pinSelect option:selected").attr('disabled','disabled').remove();
				console.log("addPin clicked",pin_number);
				socket.emit('addPwmPin',{pin:pin_number});
				drawPwmPin(pin_number);
			});
		} else if (siteName == "motor") {
			$(".startMotor").click(function() {
				socket.emit('startMotor', true);
			});
			$(".stopMotor").click(function() {
				socket.emit('stopMotor', true);
			});
			$(".reverseMotor").click(function() {
				socket.emit('reverseMotor', true);
			});
			$(".moveUp").click(function() {
				socket.emit('motorForward', true);
			});
			$(".moveDown").click(function() {
				socket.emit('motorBackward', true);
			});
			$(".moveRight").click(function() {
				socket.emit('motorForward', true);
			});
			$(".moveDown").click(function() {
				socket.emit('motorBackward', true);
			});
			
			$("#motorSpeed").on('change',function() {
				var speed = $(this).val();
				socket.emit('setMotorSpeed',speed);
			});

		} else if (siteName == "joystick") {
			var joystick = document.getElementById("joystick");
			var mov_X,mov_Y,mov_A,mov_B,mov_C,mov_D = 0;
			$(document).on("keypress",function(event) {
				mov_A = 0;
				mov_B = 0;
				mov_C = 0;
				mov_D = 0;
				switch (event.keyCode) {
					case "38":
					case 115:
						mov_A = 1;
						mov_C = 1;
					break;
					case "40":
					case 119:
						mov_B = 1;
						mov_D = 1;
					break;
					case "39":
					case 97:
						mov_B = 1;
						mov_C = 1;
					break;
					case "37":
					case 100:
						mov_A = 1;
						mov_D = 1;
					break;
					
				}
				console.log(mov_A,mov_B,mov_C,mov_D);
				socket.emit('changePwmPin',{pin_value:mov_A,pin:7,slider_mode:1});
				socket.emit('changePwmPin',{pin_value:mov_B,pin:11,slider_mode:1});
				socket.emit('changePwmPin',{pin_value:mov_C,pin:16,slider_mode:1});
				socket.emit('changePwmPin',{pin_value:mov_D,pin:18,slider_mode:1});
			});
			$(document).on("keyup",function(event) {
				console.log(event);
				socket.emit('changePwmPin',{pin_value:0,pin:7,slider_mode:1});
				socket.emit('changePwmPin',{pin_value:0,pin:11,slider_mode:1});
				socket.emit('changePwmPin',{pin_value:0,pin:16,slider_mode:1});
				socket.emit('changePwmPin',{pin_value:0,pin:18,slider_mode:1});
			});
			var hammertime = Hammer(joystick).on("touch", function(event) {
				mov_X = event.gesture.deltaX;
				mov_Y = event.gesture.deltaY;
				if(Math.abs(mov_X) > 200) {
					if (mov_X > 0){
						mov_X = 200;
					} else {
						mov_X = -200;
					}
				}
				if(Math.abs(mov_Y) > 200) {
					if (mov_Y > 0){
						mov_Y = 200;
					} else {
						mov_Y = -200;
					}
				}
				mov_X = mov_X/200;
				mov_Y = mov_Y/200;
				//UP
				if(mov_Y < 0) {
					mov_A = Math.abs(mov_Y);
					mov_C = mov_A;
					mov_B = 0;
					mov_D = 0;
					if(mov_X < 0) {
					// UP & LEFT
						if(Math.abs(mov_X) > mov_A) {
							mov_B += Math.abs(mov_A + mov_X);
							mov_A = 0;
						} else {
							mov_A += mov_X;
						}
					} else {
					//UP & RIGHT
						if(mov_X > mov_C) {
							mov_D -= mov_C - mov_X;
							mov_C = 0;
						} else {
							mov_C -= mov_X;
						}
					}
				} else {
					mov_B = mov_Y;
					mov_D = mov_B;
					mov_A = 0;
					mov_C = 0;					
				}
				socket.emit('changePwmPin',{pin_value:mov_A,pin:7,slider_mode:1});
				socket.emit('changePwmPin',{pin_value:mov_B,pin:11,slider_mode:1});
				socket.emit('changePwmPin',{pin_value:mov_C,pin:16,slider_mode:1});
				socket.emit('changePwmPin',{pin_value:mov_D,pin:18,slider_mode:1});
				$("#mov_Y").html(mov_Y);
				$("#mov_X").html(mov_X);
				$("#mov_A").html(mov_A);
				$("#mov_B").html(mov_B);
				$("#mov_C").html(mov_C);
				$("#mov_D").html(mov_D);
			});
			var hammertime2 = Hammer(joystick).on("release",function(event) {
				socket.emit('changePwmPin',{pin_value:0,pin:7,slider_mode:1});
				socket.emit('changePwmPin',{pin_value:0,pin:11,slider_mode:1});
				socket.emit('changePwmPin',{pin_value:0,pin:16,slider_mode:1});
				socket.emit('changePwmPin',{pin_value:0,pin:18,slider_mode:1});
				$("#mov_A").html(0);
				$("#mov_B").html(0);
				$("#mov_C").html(0);
				$("#mov_D").html(0);
			});
		}
	});
	/* dashboard END */
	site.initSite();
});

var GPIOs = {
	pins: {},
	tmp: {
		pin_style: ""
	},
	init: function(pins) {
		this.$pigpio = $("#pi_gpio");
		this.pins = pins;
		this.reDrawAll();
		/*
		for (var pin in pins){
			this.pins[pin] = pins[pin];
			this.reDraw(pin);
		}*/
	},
	reloadPin: function(pin, pin_data) {
		var $pin = $(".gpio_"+pin);
		this.pins[pin] = pin_data;
		if ($pin.length > 0){
			$pin.remove();
			this.reDraw(pin);
		}
	},
	reDraw: function(pin) {
		//console.log("reDraw pin:",pin);
		var $pin_status = $("<div />").addClass("status_led");
		var $pin_content = $("<div />");
		var $pin_name = $("<span />").addClass("pin_name").html("PIN "+pin+" ["+this.pins[pin]['name']+"]");
		var $pin_pwm = $("<span />").addClass("pwm_pin").addClass("pwm_pin"+pin).html("~");
		var $pin_value = $("<div />").addClass("pin_value").html(this.pins[pin]["val"]);
		var $pin_number = $("<span />").addClass("pin_number").css({background:this.pins[pin]["color"]}).html(pin);
		var $pin_type = $("<select />").attr("id", "pin_type_"+pin).addClass("pin_type_select");
		var $pin_type1 = $("<option />").val("1").html("IN");
		var $pin_type2 = $("<option />").val("2").html("OUT");
		var $pin_type3 = $("<option />").val("3").html("PWM");
		var $pin = $("<div />").addClass("gpio").addClass("gpio_"+pin).addClass("gpio_"+this.pins[pin]['pos']).css({top:this.pins[pin]["top"]}).attr('data-pin',pin);
		if(this.pins[pin]["on"]){
			$pin.addClass('gpio_on');
			$pin.css({background:this.pins[pin]["color"]});
			$pin_type.attr("disabled", "disabled");
			if(this.pins[pin]["pinmode"] == 1) {
				if(this.pins[pin]["dir"] == "input") {
					$pin_type1.attr("selected", "selected");
				} else {
					$pin_type2.attr("selected", "selected");
				}
				$pin_status.addClass('bullet_green');
			} else if (this.pins[pin]["pinmode"] == 2) {
				$pin_type3.attr("selected", "selected");
				$pin_status.addClass('bullet_blue');
				$pin_pwm.addClass("pwm_pin_on");
			}
		} else {
			$pin_status.addClass('bullet_black');
			//$pin.one('click',this.gpioClick);
		}
		$pin_type.append($pin_type1).append($pin_type2);
		$pin_status.click(this.gpioClick);
		$pin_number.click(this.gpioClick);
		$pin_name.click(this.gpioClick);
		$pin.append($pin_status);
		$pin.data('color',this.pins[pin]["color"]);
		$pin.hover(function() {
			var color = $pin.data('color');
			$pin.css({background:color});
		}, function() {
			$pin.css({background:"transparent"});
		});
		if(this.pins[pin]["pwm"]) {
			$pin_type.append($pin_type3);
			$pin.append($pin_pwm);
		}
		$pin.append($pin_number);
		$pin.append($pin_type);
		//$pin.append($pin_content);
		$pin.append($pin_name);
		$pin.append($pin_value);
		this.$pigpio.append($pin);
	},
	reDrawInactive: function(pin) {
		var $pin = $("<div />").addClass("gpio").addClass("no_gpio").addClass("gpio_"+this.pins[pin]['pos']).css({top:this.pins[pin]["top"]}).attr('data-pin',pin);
		var $pin_name = $("<span />").addClass("pin_name").html(this.pins[pin]['name']);
		var $pin_number = $("<span />").addClass("pin_number").html(pin);
		var $pin_icon = $("<span />").addClass("status_led");
		if (this.pins[pin]['name'] === "GND"){
			$pin_icon.addClass("no_requirements");
		} else {
			$pin_icon.addClass("caution_high_voltage");
		}
		$pin.append($pin_icon);
		$pin.append($pin_number);
		$pin.append($pin_name);
		this.$pigpio.append($pin);		
	},
	reDrawAll: function() {
		this.$pigpio = $("#pi_gpio").empty();
		for (pin in this.pins){
			if (this.pins[pin].inactive) {
				this.reDrawInactive(pin);
			} else {
				this.reDraw(pin);
			}
		}
	},
	gpioClick: function() {
		var $pin = $(this).parent();
		var pin = $pin.data("pin");
		var pin_mode = $pin.children("select.pin_type_select").val();
		$.event.trigger({
			type: "gpioClicked",
			pin: pin,
			pin_mode: pin_mode,
			time: new Date()
		});
	},
	turnOnOff: function(pin, callback) {
		callback();
	}
}