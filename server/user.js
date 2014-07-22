/**
 * server/user.js
 * »ç¿ëÀÚ
 */

// module
var util = require('util');

// include
var proto = require('../common/protocol');
var InitStage = require('./stage').InitStage;
var LoginStage = require('./stage').LoginStage;
var LobbyStage = require('./stage').LobbyStage;
var RoomStage = require('./stage').RoomStage;

var User = function(world, conn) {
	this.conn = conn;

	this.world = world;
	this.lobby = world.lobby;
	this.room = null;
	this.logined = false;
	this.name = '';
	this.id = '';
	this.key = '';
	this.avatar = '';
	this.nickname = '';
	this.money = 0;
	this.point = 0;
	
	this.stageList = [];
	this.stage = new InitStage(this);
	this.stage.start();
};

User.prototype = {
	light: function() {
		var user = {
			id: this.id,
			logined: this.logined,
			name: this.name,
			nickname: this.nickname,
			money: this.money
		}
		return user;
	},
	end: function() {
		this.conn.close();
	},
	leaveWorld: function() {
		if (this.room) this.room.leave(this);
		this.lobby.leave(this);
		this.world.leave(this);
		console.log('bye bye~');
	},
	nextStage: function(stage) {
		this.stageList.push(this.stage);
		this.stage = stage;
		this.stage.start();
	},
	rollbackStage: function() {
		if (this.stageList) {
			this.stage = this.stageList.pop();
		}
	},
	send: function(header, data) {
		console.log('send:', header, data);
		if (!header) {
			console.log('wrong header');
			return;
		}
		if (!this.conn) {
			console.log('closed socket');
			return;
		}
		if (typeof data == 'object') {
			if (!Buffer.isBuffer(data)) {
				data = JSON.stringify(data);
			}
		}
		this.conn.send(header, data);
	}, 
	goLogin: function() {
		this.nextStage(new LoginStage(this));
		return true;
	},
	goLobby: function() {
		if (this.room) {
			this.room.leave(this);
		}
		this.nextStage(new LobbyStage(this));
		var err = this.lobby.enter(this);
		if (err) this.rollbackStage();
		return err;
	},
	goRoom: function(room) {
		this.lobby.leave(this);
		this.nextStage(new RoomStage(this));
		var err = room.enter(this);
		if (err) this.rollbackStage();
		return err;
	}, 
	
	// connection
	onPacket: function(header, data) {
		//console.log('User:parsePacket', data);
		console.log('stage-name:'+this.stage.name);
		this.stage.clientLink(header, data);
	},
	onPacketError: function(err) {
		console.log('packet_error:', err);
		this.conn.close(proto.PK_CRITICALERROR);
		this.conn.pause();
	},
	onError: function(err) {
		console.log('socket error:', err);
		if (err.code != 'ECONNRESET') {
			this.conn.close(proto.PK_CRITICALERROR);
		}
		this.conn.pause();
	},
	onClose: function() {
		console.log('socket closed');
		this.conn = null;
		this.leaveWorld();
	}
}

module.exports = User;
