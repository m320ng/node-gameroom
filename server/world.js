/**
 * world.js
 * 서버
 * 
 * @require net
 */

// module
var net = require('net');
var util = require('util');

// include
var proto = require('../common/protocol');
var Connection = require('../common/connection');
var User = require('./user');
var Lobby = require('./lobby');

var World = function() {
	// 기본옵션
	this.option = {
		port: 8080,
		maxConnection: 10000,
		maxUser: 10000,
		maxRoom: 1000
	}

	// 소켓서버
	this.server = net.createServer();

	// 유저목록
	this.users = [];
	this.lobby = new Lobby(this);

	// server-event
	var self = this;
	this.server.on('connection', function(socket) {
		self.onConnection(socket);
	});
	this.server.on('error', function(err) {
		console.log('err:', err.message);
		self.onError(err);
	});
	this.server.on('close', function() {
		self.onClose();
	});
}

util.inherits(World, require('events').EventEmitter);

util._extend(World.prototype, {
	config: function(option) {
		if (option) {
			util._extend(this.option, option);
		}
		console.log('## Setting ################################');
		console.log(this.option);
	},
	start: function() {
		console.log('## Start #################################');
		console.log('Welcome to the world~');
	
		this.server.listen(this.option.port);
		console.log('Listen:', this.option.port);
	},
	enter: function(user) {
		this.users.push(user);
		console.log('current user:' + this.users.length);
	},
	leave: function(user) {
		var index = this.users.indexOf(user);
		this.users.splice(index, 1);
		console.log('current user:' + this.users.length);
	},
	
	onConnection: function(socket) {
		var conn = new Connection(socket);
		if (this.option.maxConnection <= this.users.length) {
			conn.close(proto.PK_CRITICALERROR, 'max connection error');
			return;
		}
		
		var user = new User(this, conn);
		this.enter(user);
		
		// socket-event
		var self = this;
		conn.on('packet', function(header, data) {
			user.onPacket(header, data);
		});
		conn.on('packet_error', function(err) {
			user.onPacketError(err);
		});
		conn.on('error', function(err) {
			user.onError(err);
		});
		conn.on('close', function() {
			user.onClose();
		});
	},
	onError: function(err) {
		console.log('server error:', err.message);
	},
	onClose: function(close) {
		console.log('server close');
	}
});

module.exports = new World();
