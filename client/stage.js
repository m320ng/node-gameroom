/**
 * client/stage.js
 * 각종 상태들
 *
 */

 // module
var util = require('util');

// include
var proto = require('../common/protocol');
var utils = require('../common/utils');

// local function
function toJson(arg) {
	var json = null;
	try {
		if (typeof arg == 'object') {
			if (Buffer.isBuffer(arg)) {
				arg = arg.toString('utf-8');
			}
		}
		json = JSON.parse(arg);
	} catch(e) {}
	return json;
}

var IntroStage = function(user) {
	this.name = 'Intro';
	this.user = user;
}
util._extend(IntroStage.prototype, {
	start : function() {
		this.user.print('## Intro ##############################');
		this.user.print('Connection...');
		this.user.send(proto.PK_CONNECT, 'hello world');
	},
	serverLink: function(header, data) {
		if (header == proto.PK_CONNECT) {
			if (data=='OK') {
				this.user.goLogin();
			} else {
				this.user.print('Error:', data);
				this.user.end();
			}
		}
	},
	command: function(cmdline) {
	}
});
var LoginStage = function(user) {
	this.name = 'Login';
	this.user = user;
}
util._extend(LoginStage.prototype, {
	start : function() {
		this.user.print('## Login ##############################');
		this.user.print('Input your name:');
	},
	serverLink: function(header, data) {
		if (header == proto.PK_LOGIN) {
			if (data=='OK') {
				this.user.goLobby();
			} else {
				this.user.print('Error:', data);
				this.user.end();
			}
		}
	},
	command: function(cmdline) {
		if (!utils.trim(cmdline)) {
			this.user.print('Input your name:');
			return;
		}
		var name = cmdline;
		this.user.send(proto.PK_LOGIN, name);
		this.user.name = name;
	}
});
var LobbyStage = function(user) {
	this.name = 'Lobby';
	this.user = user;
}
util._extend(LobbyStage.prototype, {
	start : function() {
		this.user.print('## Lobby ##############################');
		this.user.print('welcome lobby');
		
	},
	serverLink: function(header, data) {
		if (header == proto.PK_LOBBY_CHAT) {
			var json = toJson(data);
			this.user.print('[' + json.name + '] ' + json.message);
		} else if (header == proto.PK_ROOM_LIST) {
			var json = toJson(data);
			if (!json.list || json.list.length == 0) {
				this.user.print('no rooms');
				return;
			}
			var self = this;
			json.list.forEach(function(room) {
				self.user.print(room.no + ' ' + room.name);
			});
		} else if (header == proto.PK_ENTER_ROOM) {
			var json = toJson(data);
			console.log(json);
			if (!json.success) {
				this.user.print('error:' + json.message);
				return;
			}
			this.user.print('room info: ', json.room);
			this.user.goRoom(json.room);
		} else if (header == proto.PK_MAKE_ROOM) {
			var json = toJson(data);
			console.log(json);
			if (!json.success) {
				this.user.print('error:' + json.message);
				return;
			}
			this.user.print('room info: ', json.room);
		}
	},
	command: function(cmdline) {
		if (cmdline[0]=='/') {
			var cmd = cmdline.substring(1).toLowerCase();
			var items = cmd.split(' ');
			if (items[0]=='list') {
				this.user.send(proto.PK_ROOM_LIST);
				return;
			} else if (items[0]=='enter') {
				if (items.length < 2) {
					this.user.print('error room no');
					return;
				}
				this.user.send(proto.PK_ENTER_ROOM, utils.trim(items[1]));
				return;
			} else if (items[0]=='make') {
				if (items.length < 2) {
					this.user.print('error room name');
					return;
				}
				this.user.send(proto.PK_MAKE_ROOM, utils.trim(items[1]));
				return;
			}
		}
	
		var message = cmdline;
		this.user.send(proto.PK_LOBBY_CHAT, message);
	}
});
var RoomStage = function(user, room) {
	this.name = 'Room';
	this.user = user;
	this.room = room;
}
util._extend(RoomStage.prototype, {
	start : function() {
		this.user.print('## Room ##############################');
		this.user.print('welcome room');
	},
	serverLink: function(header, data) {
		if (header == proto.PK_ROOM_CHAT) {
			var json = toJson(data);
			this.user.print('[' + json.name + '] ' + json.message);
		} else if (header == proto.PK_USER_LIST) {
			var json = toJson(data);
			if (!json.list) {
				this.user.print('no users');
				return;
			}
			var self = this;
			json.list.forEach(function(user) {
				self.user.print('['+self.nickname+']');
			});
		} else if (header == proto.PK_NEW_USER) {
			var json = toJson(data);
			this.user.print('[' + json.nickname + ']님이 들어오셨습니다.');
		} else if (header == proto.PK_LEAVE_USER) {
			var json = toJson(data);
			this.user.print('[' + json.nickname + ']님이 나가셨습니다.');
		} else if (header == proto.PK_LEAVE_ROOM) {
			this.user.goLobby();
		} else if (header == proto.PK_MAKE_ROOM) {
			var json = toJson(data);
			console.log(json);
			if (!json.success) {
				this.user.print('error:' + json.message);
				return;
			}
			this.user.print('room info: ', json.room);
		}

		if (header == proto.PK_START_GAME) {
			var json = toJson(data);
			if (!json.success) {
				this.user.print('error:'+json.message);
				return;
			}
			this.user.print('poker start!');
		} else if (header == proto.PK_PLAYER_READY_GAME) {
			var json = toJson(data);
			this.user.print('player-ready:' + util.inspect(json));
		} else if (header == proto.PK_ALLOW_START_GAME) {
			this.user.print('poker start allow!');
			this.user.send(proto.PK_ALLOW_START_GAME);
		} else if (header == proto.PK_YOUR_TURN) {
			this.user.send(proto.PK_SELECT_BETTING);
		} else if (header == proto.PK_PLAYER_TURN) {
			var json = toJson(data);
			this.user.print('player-turn:' + util.inspect(json));
		} else if (header == proto.PK_GIVE_CARD) {
			var json = toJson(data);
			this.user.print('get-card:' + util.inspect(json));
			this.user.send(proto.PK_RECEIVE_CARD);
		} else if (header == proto.PK_COMPLETE_GAME) {
			var json = toJson(data);
			var winner = json.winner;
			var judge = json.judge;
			console.log(winner);
			console.log(judge);
		}
	},
	command: function(cmdline) {
		if (cmdline[0]=='/') {
			var cmd = cmdline.substring(1).toLowerCase();
			var items = cmd.split(' ');
			if (items[0]=='leave') {
				this.user.send(proto.PK_LEAVE_ROOM);
				//this.user.goLobby();
				return;
			} else if (items[0]=='ready') {
				this.user.send(proto.PK_READY_GAME);
				return;
			} else if (items[0]=='start') {
				this.user.send(proto.PK_START_GAME);
				return;
			} else if (items[0]=='chat') {
				if (items.length < 2) {
				}
				//this.user.send(proto.PK_ENTER_ROOM, utils.trim(items[1]));
				return;
			}
		}
	
		var message = cmdline;
		this.user.send(proto.PK_ROOM_CHAT, message);
	}
});

module.exports = {
	IntroStage: IntroStage,
	LoginStage: LoginStage,
	LobbyStage: LobbyStage,
	RoomStage: RoomStage
}