var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	gpio = require('pi-gpio'),
	pins = {
		19:{
			"dir":"output",
			"on":false,
			"val":0
		},
		21:{
			"dir":"output",
			"on":false,
			"val":0
		},
		23:{
			"dir":"output",
			"on":false,
			"val":0
		}
	},
	static_dir = __dirname+'/static/';
var engine_loop;
var engine_on = false;
var active_pin;
var led_status = 0;
var led_interval = 500;
var motor_step = 2;
server.listen(3000);
/*3:{"dir":"output","on":false}
		,5:{"dir":"output","on":false}
		,*/
//initPins();
closePins();

app.get('/', function(req,res){
	res.sendfile(static_dir + '/index.html');
});
app.get('/led.html', function(req,res){
	res.sendfile(static_dir + '/led.html');
});
app.get('/jquery.min.js', function(req,res){
	res.sendfile(static_dir + '/jquery.min.js');
});
app.get('/raspberryio.js', function(req,res){
	res.sendfile(static_dir + '/raspberryio.js');
});
app.get('/raspberry_led.js', function(req,res){
	res.sendfile(static_dir + '/raspberry_led.js');
});

io.sockets.on('connection', function(socket){
	socket.on('send message', function(data) {
		io.sockets.emit('new message', data); //send to all client
		console.log(data);
	});
	socket.on('start engine', function(data) {
		startEngine();
		//console.log(data);
	});
	socket.on('stop engine', function(data) {
		stopEngine();
		//console.log(data);
	});
	socket.on('change led interval', function(data) {
		if(isNaN(data)){ 
			led_interval = 500;
		} else {
			led_interval = data;
		}
		startEngine();
	});
});

function initPins(){
	for(var pin in pins){
		gpio.open(parseInt(pin), pins[pin]["dir"], function(err) {
			pins[pin]["on"] = true;
		});
	};
}
function closePins(){
	for(var pin in pins){
		if(pins[pin]["on"]){
			pins[pin]["on"] = false;
			if(pins[pin]["dir"] == "output"){
				gpio.write(parseInt(pin),0,function(){});
				pins[pin]["val"] = 0;
			}
			gpio.close(parseInt(pin));
		}
	}
}

function startEngine(){
	stopEngine();
	initPins();
	if(!engine_on){
		switchOn(19);
		switchOff(21);
		switchOff(23);
		active_pin = 19;
		engine_on = true;
	}
	engine_loop = setInterval(function(){
		/*
		switch(motor_step){
			case 1:
				switchOn(7);
				switchOff(19);
				switchOff(21);
				switchOff(23);
			break;
			case 2:
				switchOff(7);
				switchOn(19);
				switchOff(21);
				switchOff(23);
			break;
			case 3:
				switchOff(7);
				switchOff(19);
				switchOn(21);
				switchOff(23);
			break;
			case 4:
				switchOff(7);
				switchOff(19);
				switchOff(21);
				switchOn(23);
			break;
		}
		if(motor_step == 3 ){
			motor_step = 2;
		} else {
			motor_step++;
		}
		*/
		if(active_pin == 19){
			switchOff(19);
			switchOn(21);
			switchOff(23);
			active_pin = 21;
		} else if(active_pin == 21) {
			switchOff(19);
			switchOff(21);
			switchOn(23);
			active_pin = 23;
		} else if(active_pin == 23) {
			switchOn(19);
			switchOff(21);
			switchOff(23);
			active_pin = 19;	
		}
		console.log("Pin19: " + pins[19]["val"] + "\nPin21: " + pins[21]["val"] + "---------\n");
		
	},led_interval);
}

function stopEngine(){
	clearInterval(engine_loop);
	engine_on = false;
	//switchOff(7);
	switchOff(19);
	switchOff(21);
	switchOff(23);
	closePins();
}

function switchPin(pin){
	if(pins[pin]["val"] == 1) {
		pins[pin]["val"] = 0;
	} else {
		pins[pin]["val"] = 1;
	}
	gpio.write(pin, pins[pin]["val"], function() {});
}

function switchOff(pin){
	gpio.write(pin, 0, function() {
		pins[pin]["val"] = 0;
	});
}
function switchOn(pin){
	gpio.write(pin, 1, function() {
		pins[pin]["val"] = 1;
	});
}
function turnOn(pin){
	gpio.open(parseInt(pin), pins[pin]["dir"], function(err) {
		pins[pin]["on"] = true;
	});
}
function turnOff(pin){
	gpio.close(parseInt(pin), function(err) {
		pins[pin]["on"] = false;
	});
}