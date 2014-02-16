var express = require('express'),
	app = express(),
	fs = require('fs'),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	gpio = require('pi-gpio'),
	pins = require('./libs/gpio-pins2'),
	servo = require('./libs/servo'),
	static_dir = __dirname+'/static/',
	public_dir = __dirname+'/public/',
	p_now = require("performance-now"),
	media_folder_usb = "public/usb_emulator/",
	media_folder_local = "public/storage/",
	media_depth = new Array();
	/*,
	mysql = require('mysql').createConnection({
	  host     : 'localhost',
	  user     : 'root',
	  password : '',
	  database: 'raspberrypi'
	});
	
	mysql.connect();
	mysql.query('SELECT * FROM files AS solution', function(err, rows, fields) {
	  if (err) throw err;
	
	  console.log('The solution is: ', rows[0].solution);
	});
	mysql.end();
	
	
	//"public/usb/Media/"
	
	//TODO! users to modules
	/*
	var users = {};
	
	var User = function(socket){
		var socket = socket;
		return this;
	}
	*/
	server.listen(2013);
	console.log("Server started at:		http://192.168.1.45:2013/");

	//pins.initPins();
	pins.initBrushedMotor(7,11,16,18);
	//servo.servoHover({"motor":1,"on":true,"step":1,"speed":700});
	//servo.servoHover({"motor":2,"on":true,"step":5,"speed":1200});

/*
	pins.openDigitalOut(13,function() {
		setInterval(function() {
			var start = p_now();
			pins.triggerPin(13, function() {
				var end = p_now();
				console.log((start-end).toFixed(3));
			});
		}, 500);
	});
*/

	app.get('/', function(req,res){
		res.sendfile(static_dir + 'videoo.html');
		console.log("Client connected!");
	});
	
	app.get('/gpio', function(req,res){
		res.sendfile(static_dir + 'index.html');
		console.log("Client connected!");
	});
	
	app.get('/usbstore', function(req,res){
		res.sendfile(static_dir + 'media.html');
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

	function getExtension(filename) {
	    var i = filename.lastIndexOf('.');
	    return (i < 0) ? '' : filename.substr(i+1);
	}

	io.sockets.on('connection', function(socket){
		//users[users.length] = new User(socket);
		//console.log(users);
		
		socket.on('getFileList', function(data) {
			if(typeof data.path != "undefined"){
				media_depth = data.path.split("/");
				var media_folder = media_folder_usb;
				if(data.drive == "USB") {
					media_folder = media_folder_usb;					
				} else if (data.drive == "SD") {
					media_folder = media_folder_local;
				}
				fs.exists(media_folder+data.path, function(path_exists) {
					if(path_exists){
						fs.readdir(media_folder+data.path, function(err, files) {
							var files_data = new Array();
							for (file in files) {
								console.log(files[file]);
								var file_path;
								var public_file_path;
								if (media_folder+data.path == media_folder) {
									file_path = media_folder+data.path+files[file];
								} else {
									file_path = media_folder+data.path+"/"+files[file];
								}
								console.log("file path:",file_path);
								var file_data = {
									"name": files[file],
									"path": file_path,
									"public_path": file_path.substr(7),
									"is_dir": fs.lstatSync(file_path).isDirectory(file_path),
									"is_file": fs.lstatSync(file_path).isFile(file_path),
									"ext": getExtension(files[file])
								};
								files_data.push(file_data);
							}
							var send_data = {	
							"files":files,
							"files_data": files_data,
							"depth":media_depth.length,
							"path": data.path
							};
							socket.emit('dataFileList',send_data, function() {
								console.log();
							})
						});
					}
				});
			}
		});
		
		socket.on('init gpio', function(data) {
			socket.emit('init gpio data', pins['pins']); //send to all client
			log(data);
		});
		
		socket.on('close gpios', function(data) {
			//pins.closePins();
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

		/* python api */

		socket.on('distanceCm',function(distance) {
			console.log(distance);
		});
//
//		setInterval(function() {
//			console.log('get_distance');
//			socket.emit('get_distance');
//		}, 2500);

		/* gpio-s */

		socket.on('turnPinONOFF',function(pin) {
			console.log("turnPinONOFF",pin);
			pins.turnOnOff(pin, function() {
				socket.emit('changed gpio data', pins);
			});
		});
		
		socket.on('closePin',function(data) {
			pins.closePin(data.pin, function() {
				socket.broadcast.emit('gpioChange',{"pin":data.pin,"pin_data":pins.pins[data.pin]});
			});
		});
		
		socket.on('gpioChange',function(data) {
			if(pins.pins[data.pin]["on"]){
				console.log(pin,"KI KELL KAPCSOLNI!");
				pins.closePin(data.pin, function() {
					socket.emit('gpioChanged',{"pin":data.pin,"pin_data":pins.pins[data.pin]});
				});
			} else {
				console.log(pin,"BE KELL KAPCSOLNI!");
				if (data.pin_mode == 1){
					pins.setPinMode(data.pin, 1, function() {
						pins.setPinDirection(data.pin, "input", function() {
							pins.openPin(data.pin, function() {
								socket.emit('gpioChanged',{"pin":data.pin,"pin_data":pins.pins[data.pin]});
							});
						});
					});
				} else if (data.pin_mode == 2){
					pins.setPinMode(data.pin, 1, function() {
						pins.setPinDirection(data.pin, "output", function() {
							pins.openPin(data.pin, function() {
								socket.emit('gpioChanged',{"pin":data.pin,"pin_data":pins.pins[data.pin]});
							});
						});
					});
				} else if (data.pin_mode == 3){
					pins.setPinMode(data.pin, 2, function() {
						pins.pins[data.pin]['on'] = true;
						socket.emit('gpioChanged',{"pin":data.pin,"pin_data":pins.pins[data.pin]});
					});
				}
			}
			//socket.emit('gpioChanged',{"pin":data.pin,"pin_data":pins.pins[data.pin]});
		});

		socket.on('servoHover',function(data) {
			pins.servoHover(data);
		});

		socket.on('changePwmPin',function(data) {
			console.log("changePwm data:",data);
			if(data.slider_mode == "1"){
				pins.pwm({"pin":parseInt(data.pin,10),"pin_value":data.pin_value}, function() {});
			} else if (data.slider_mode == "2") {
				// servo ~0.14 - ~0.27
				pins.pwm({"pin":parseInt(data.pin,10),"pin_value":data.pin_value}, function() {});
				//pins.digitalPulse(data.pin,data.pin_value);
			}
			//console.log('changePwmPin', data);
			socket.broadcast.emit('sliderChanged',{"pin":data.pin,"pin_value":data.pin_value});
		});
		
		socket.on('addPwmPin',function(dt){
			console.log('addPwmPin dt:',dt);
			pins.setPinMode(dt.pin, 2, function() {
				pins.pins[dt.pin]['on'] = true;		
				socket.emit('init gpio data', pins['pins']);
			});
		});
		socket.on('goMotorAngle',function(dt) {
			pins.setBrushedMotor(true, dt.angle);
		});
		socket.on('stopMotorAngle',function(dt) {
			pins.setBrushedMotor(false, dt.angle);
		});
		socket.on("changeJoystick",function(dt) {
			var motor_data;
			//motor_data = pins.setBrushedMotorByJoystick(dt.mov_X,dt.mov_Y);
			motor_data = servo.setServoByJoystick(dt.mov_X,dt.mov_Y);
			console.log(motor_data);
			if (typeof motor_data != "undefined") {
				socket.broadcast.emit("joystickChanged",motor_data);
			}
		});
		
		socket.on('startMotor',function(dt){
			console.log('startMotor!!!');
			pins.startMotor();
		});
		
		socket.on('stopMotor',function(dt){
			console.log('stopMotor!!!');
			pins.stopMotor();
		});
		
		socket.on('reverseMotor',function(dt){
			console.log('reverseMotor!!!');
			pins.reverseMotor();
		});
		
		socket.on('setMotorSpeed',function(dt){
			console.log('SetMotorSpeed:',dt);
			pins.setMotorSpeed(dt);
		});

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