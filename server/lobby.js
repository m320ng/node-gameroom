/**
 * lobby.js
 * 로비
 * 
 */

// module
var util = require('util');

// include
var proto = require('../common/protocol');
var PokerRoom = require('./poker_room');

var Lobby = function(world) {
	this.world = world;
	this.users = [];
	this.rooms = [];
	
	this.freeRoomNo = [];
	
	for (i=0; i<this.world.option.maxRoom; i++) {
		this.freeRoomNo.push(i+1);
	}
};

util._extend(Lobby.prototype, {
	broadcast: function(method, without) {
		this.users.forEach(function(other) {
			if (!without || other!=without) {
				method(other);
			}
		});
	},
	enter: function(user) {
		if (this.world.option.maxUser <= this.users.length) {
			return '현재 서버가 모두 찻습니다.';
		}
		this.users.push(user);
		return null;
	},
	leave: function(user) {
		var index = this.users.indexOf(user);
		this.users.splice(index, 1);
		return null;
	},
	chat: function(user, message) {
		this.broadcast(function(other) {
			other.stage.sendChat(user, message);
		}, user);
	},
	getRoomList: function() {
		var roomList = [];
		this.rooms.forEach(function(room) {
			roomList.push(room.light());
		});
		return roomList;
	},
	freeRoom: function(room) {
		console.log('[free-room] ', room.no);
		room.free();
		var index = this.rooms.indexOf(room);
		this.rooms.splice(index, 1);
		this.freeRoomNo.push(room.no);
		// numberic sort
		this.freeRoomNo.sort(function(a,b){return a-b});
	},
	makeRoom: function(name) {
		if (this.freeRoomNo.length==0) return null;
		
		var no = this.freeRoomNo.shift();
		var room = new PokerRoom(no, this);
		room.name = name;
		this.rooms.push(room);
		
		return room;
	},
	findRoom: function(no) {
		var room = null;
		this.rooms.forEach(function(other) {
			if (other.no==no) {
				room = other;
				return false;
			}
		});
		return room;
	}
});

module.exports = Lobby;
