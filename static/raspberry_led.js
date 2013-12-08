jQuery(function($){
	var socket = io.connect();
	var $startBtn = $('#start');
	var $stopBtn = $('#stop');
	var $ledInterval = $('#ledinterval');
	var $consoleLogger = $('#console_logger');
	$startBtn.click(function() {
		socket.emit('start engine', 1);
	});
	$stopBtn.click(function() {
		socket.emit('stop engine', 1);
	});
	$ledInterval.change(function() {
		socket.emit('change led interval', parseInt($(this).val()));
	});
	socket.on('new logdata', function(data){
		$consoleLogger.prepend(data + "<br/>");
	});
});