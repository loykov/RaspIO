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
			alert("És a hardware hogy áll? :)");
		},
		led: function() {
		},
		motor: function() {
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
			var $slider1 = $(".pwm-slider");
			var pin1 = $slider1.data('pin');
			$slider1.change(function() {
				console.log("slided", $(this).val(), pin1);
				
				$("#container").trigger('sliderChanged', [pin1,$(this).val()]);
			});
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
	socket.on('changed gpio data', function(gpio_data) {
		console.log("changed gpio data");
		console.log(gpio_data);
		GPIOs.reDrawAll();
	});
	$("#content").on('click', '#close_all_gpio', function() {
		console.log("close all");
		socket.emit('close gpios', true);
	});
	$(document).on('gpioClicked',function(e) {
		//var pin = $(this).data('pin');
		console.log("gpio click",e.pin);
		socket.emit("turnPinONOFF",e.pin);
	});
	$(document).on('sliderChanged','#container',function(event, param1, param2) {
		console.log('sliderChanger  pin: ',param1,"value",param2);
		socket.emit('changePwmPin',{pin_value:param2,pin:param1});
	})
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
		for (var pin in pins){
			this.pins[pin] = pins[pin];
			this.reDraw(pin);
		}
	},
	reDraw: function(pin) {
		console.log("reDraw pin:",pin);
		var $pin_content = $("<div />").addClass("status_led");
		var $pin = $("<div />").addClass("gpio").addClass("gpio_"+pin).addClass("gpio_"+this.pins[pin]['pos']).css({top:this.pins[pin]["top"]}).attr('data-pin',pin).click(this.gpioClick);
		if(this.pins[pin]["on"]){
			$pin.addClass('gpio_on');
		}
		if(this.pins[pin]["pwm"]) {
			$pin.append("<span>PWM</span>");
		}
		$pin.append($pin_content);
		this.$pigpio.append($pin);
	},
	reDrawAll: function() {
		this.$pigpio = $("#pi_gpio").empty();
		for (pin in this.pins){
			this.reDraw(pin);
		}	
	},
	gpioClick: function() {
		//e.preventDefaul();
		var pin = $(this).addClass("gpio_on").data('pin');
		$(this).children(".status_led").addClass("bullet_white");
		$.event.trigger({
			type: "gpioClicked",
			pin: pin,
			time: new Date()
		});
		console.log("click pin: ",pin);
		
		// *** GPIOs.turnOn(pin);
	},
	turnOnOff: function(pin, callback) {
		callback();
	}
}