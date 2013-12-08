jQuery(function($){
	var socket = io.connect();
	var $consoleForm = $('#console-logger');
	var $consoleMsg = $('#console-msg');
	var $consoleBox = $('#console-messages');
	$consoleForm.submit(function(e) {
		e.preventDefault();
		socket.emit('send message', $consoleMsg.val());
		$consoleMsg.val('');
	});
	socket.on('new message', function(data){
		$consoleBox.append(data + "<br/>");
	});
});