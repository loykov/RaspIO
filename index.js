var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	gpio = require('pi-gpio'),
	pins = require('./libs/gpio-pins2'),
	close = require('./libs/close'),
	static_dir = __dirname+'/static/';
	
	//TODO! users to modules
	/*
	var users = {};
	
	var User = function(socket){
		var socket = socket;
		return this;
	}
	*/
	server.listen(2013);
	console.log("Server started at:		http://192.168.1.184:2013/");

	//pins.initPins();
	
	app.get('/', function(req,res){
		res.sendfile(static_dir + 'index.html');
		console.log("Client connected!");
	});
	
	app.get('/video',function(req, res) {
		res.sendfile(static_dir + 'video2.html');
	});

	app.get('/chat',function(req, res) {
		res.sendfile(static_dir + 'chat.html');
	});
	
	app.use(express.static(__dirname + '/public'));
	
	/* routing */
	app.get('/header.html', function(req,res){
		res.sendfile(static_dir + '/header.html');
	});
		
	io.sockets.on('connection', function(socket){
		//users[users.length] = new User(socket);
		//console.log(users);
		
		socket.on('init gpio', function(data) {
			socket.emit('init gpio data', pins['pins']); //send to all client
			log(data);
		});
		
		socket.on('close gpios', function(data) {
			pins.closePins();
			socket.emit('changed gpio data', pins); //send to all client
		});
	
		socket.on('message', function (message) {
			log('Got message:', message);
			socket.broadcast.emit('message', message);
		});
	
		socket.on('create or join', function (room) {
			var numClients = io.sockets.clients(room).length;
	
			log('Room ' + room + ' has ' + numClients + ' client(s)');
			log('Request to create or join room ' + room);
	
			if (numClients === 0){
				socket.join(room);
				socket.emit('created', room);
			} else if (numClients === 1) {
				io.sockets.in(room).emit('join', room);
				socket.join(room);
				socket.emit('joined', room);
			} else { // max two clients
				socket.emit('full', room);
			}
			socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
			socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);
	
		});

		/* gpio-s */

		socket.on('turnPinONOFF',function(pin) {
			console.log("turnPinONOFF",pin);
			pins.turnOnOff(pin, function() {
				socket.emit('changed gpio data', pins);
			});
		});

		socket.on('changePwmPin',function(data) {
			console.log("changePwm data:",data);
			pins.pwm({"pin":parseInt(data.pin,10),"pin_value":data.pin_value}, function() {});
			//console.log('changePwmPin', data);
			socket.broadcast.emit('sliderChanged',{"pin":data.pin,"pin_value":data.pin_value});
		});
		
		socket.on('addPwmPin',function(dt){
			pins['pins'][dt['pin']]['on'] = true;
			socket.emit('init gpio data', pins['pins']);
		})

		/*
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
		});*/
		/* TODO! socket closed / disconnected event handling */
		function log(){
			var array = [">>> Message from server: "];
			for (var i = 0; i < arguments.length; i++) {
				array.push(arguments[i]);
			}
			socket.emit('log', array);
		}
	});

//handle exit
process.stdin.resume();
process.on('SIGINT', function () {
	console.log('Good bye. RaspberryIO now shutting down...');
	pins.closeAll(closeProcess);
});

var closeProcess = function() {
	console.log(" --- EXIT --- ");
	process.exit();
};