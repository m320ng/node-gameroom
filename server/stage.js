/**
 * server/stage.js
 * 각종 상태들
 *
 */

 // module
var util = require('util');

// include
var proto = require('../common/protocol');
var utils = require('../common/utils');

// init
var InitStage = function(user) {
	this.name = 'Init';
	this.user = user;
}
util._extend(InitStage.prototype,	{
	start : function() {
	},

	recvConnect: function() {
		this.sendConnect();
		this.user.goLogin();
	},

	sendConnect: function() {
		this.user.send(proto.PK_CONNECT, 'OK');
	},

	clientLink: function(header, data) {
		if (header == proto.PK_CONNECT) {
			this.recvConnect();
		}
	}
});

// in login
var LoginStage = function(user) {
	this.name = 'Login';
	this.user = user;
}
util._extend(LoginStage.prototype,	{
	start : function() {
	},

	recvLogin: function(name) {
		this.user.nickname = name;
		this.user.logined = true;
		
		var err = this.user.goLobby();
		this.sendLogin(err);
	},
	
	sendChat: function(talker, message) {
		this.user.send(proto.PK_LOBBY_CHAT, {name:talker.nickname, message:message});
	},
	sendLogin: function(err) {
		if (!err) {
			this.user.send(proto.PK_LOGIN, 'OK');
		} else {
			this.user.send(proto.PK_LOGIN, ret);
		}
	},

	clientLink: function(header, data) {
		if (header == proto.PK_LOGIN) {
			var name = data.toString('utf-8');
			this.recvLogin(name);
		}
	}
});

// in lobby
var LobbyStage = function(user) {
	this.name = 'Lobby';
	this.user = user;
}
util._extend(LobbyStage.prototype,	{
	start : function() {
	},

	recvLobbyChat: function(message) {
		this.user.lobby.chat(this.user, message);
	},
	recvRoomList: function() {
		var roomList = this.user.lobby.getRoomList();
		this.sendRoomList(roomList);
	},
	recvMakeRoom: function(roomName) {
		var room = this.user.lobby.makeRoom(roomName);
		if (room) {
			var err = this.user.goRoom(room);
			if (err) {
				this.sendEnterRoom({success:false, message:'방에 들어갈 수 없습니다.' + err});
				return;
			}
			this.sendEnterRoom({success:true, room:room.light()});
		} else {
			this.sendMakeRoom({success:false, message:'방을 만들지 못하였습니다.'});
		}
	},
	recvEnterRoom: function(roomNo) {
		var room = this.user.lobby.findRoom(roomNo);
		if (!room) {
			this.sendEnterRoom({success:false, message:'방을 찾을 수 없습니다.'});
			return;
		}
		var err = this.user.goRoom(room);
		if (err) {
			this.sendEnterRoom({success:false, message:'방에 들어갈 수 없습니다.' + err});
			return;
		}
		this.sendEnterRoom({success:true, room:room.light()});

		var self = this;
		room.broadcast(function(other) {
			other.stage.sendNewUser(self.user);
		}, this.user);
	},

	sendRoomList: function(roomList) {
		this.user.send(proto.PK_ROOM_LIST, {list:roomList});
	},
	sendMakeRoom: function(result) {
		this.user.send(proto.PK_MAKE_ROOM, result);
	},
	sendEnterRoom: function(result) {
		this.user.send(proto.PK_ENTER_ROOM, result);
	},

	clientLink: function(header, data) {
		if (header == proto.PK_LOBBY_CHAT) {
			var message = data.toString('utf-8');
			this.recvLobbyChat(message);
		} else if (header == proto.PK_ROOM_LIST) {
			this.recvRoomList();
		} else if (header == proto.PK_MAKE_ROOM) {
			var roomName = data.toString('utf-8');
			this.recvMakeRoom(roomName);
		} else if (header == proto.PK_ENTER_ROOM) {
			var roomNo = data.toString('utf-8');
			this.recvEnterRoom(roomNo);
		}
	}
});

// in room
var RoomStage = function(user) {
	this.name = 'Room';
	this.user = user;
	this.ready = false;
}
util._extend(RoomStage.prototype, {
	start : function() {
	},

	recvRoomChat: function(message) {
		this.user.room.chat(this.user, message);
	},
	recvLeaveRoom: function() {
		this.user.goLobby();
	},
	
	sendLeaveUser: function(leaveuser) {
		this.user.send(proto.PK_LEAVE_USER, leaveuser.light());
	},
	sendLeaveRoom: function() {
		this.user.send(proto.PK_LEAVE_ROOM);
	},
	sendRoomChat: function(user, message) {
		this.user.send(proto.PK_ROOM_CHAT, {name:user.nickname, message:message});
	},
	sendNewUser: function(newuser) {
		this.user.send(proto.PK_NEW_USER, newuser.light());
	},

	clientLink: function(header, data) {
		if (header == proto.PK_ROOM_CHAT) {
			var message = data.toString('utf-8');
			this.recvRoomChat(message);
		} else if (header == proto.PK_LEAVE_ROOM) {
			this.recvLeaveRoom();
		}
	}
});

module.exports = {
	InitStage: InitStage,
	LoginStage: LoginStage,
	LobbyStage: LobbyStage,
	RoomStage: RoomStage
}