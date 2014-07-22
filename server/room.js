/**
 * chat_room.js
 * 대화방
 * 그냥 대화만..
 */

// module
 var util = require('util');

// include
var proto = require('../common/protocol');

var Room = function(no, lobby) {
	this.lobby = lobby;
	this.no = no;
	this.users = [];
	this.captain = null;
};

util._extend(Room.prototype, {
	light: function() {
		var users = [];
		this.users.forEach(function(user) {
			users.push(user.light());
		});
		var room = {
			type:this.type, 
			no:this.no, 
			name:this.name,
			users:users
		}
		return room;
	},
	broadcast: function(method, without) {
		this.users.forEach(function(other) {
			if (!without || other!=without) {
				method(other);
			}
		});
	},
	enter: function(user) {
		if (this.users.length==0) {
			this.captain = user;
		}
		this.users.push(user);
		user.room = this;

		return null;
	},
	leave: function(user) {
		this.broadcast(function(other) {
			other.stage.sendLeaveUser(user);
		}, user);
		user.send(proto.PK_LEAVE_ROOM);

		if (this.captain==user && this.users.length>0) {
			this.captain = this.users[0];
		}
	
		var index = this.users.indexOf(user);
		this.users.splice(index, 1);
		if (this.users.length==0) {
			this.lobby.freeRoom(this);
		}
		user.room = null;
		return null;
	},
	free: function() {
		this.users.forEach(function(user) {
			user.game = null;
			user.goLobby();
		});
	},
	chat: function(user, message) {
		this.broadcast(function(other) {
			other.stage.sendRoomChat(user, message);
		}, user);
	}
});

module.exports = Room;