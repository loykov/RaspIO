module.exports = {
	users : {},
	addUser: function(name, socket, callback) {
		var err = false;
		var token;
		if (this.users[name]){
			err = "Nickname already taken.";
		} else {
			token = require('crypto').createHash('md5').update(name+Math.floor((Math.random()*100000))+socket).digest("hex");
			this.users[name] = {
				socket: socket,
				token: token
			};
		}
		return callback(err, token);
	},
	removeUser: function(name) {
		delete this.users[name];
	},
	getSocket: function(name, token) {
		if(this.users[name] && this.users[name].token === token) {
			return this.users[name].socket;
		}
	}
}