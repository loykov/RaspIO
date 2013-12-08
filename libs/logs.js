module.exports = {
	log: function () {
		var array = [">>> Message from server: "];
		for (var i = 0; i < arguments.length; i++) {
			array.push(arguments[i]);
		}
		//nem máködik így
		//socket.emit('log', array);
	}
}