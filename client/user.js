/**
 * client/user.js
 * »ç¿ëÀÚ
 */

// module
var util = require('util');

// include
var proto = require('../common/protocol');
var utils = require('../common/utils');
var IntroStage = require('./stage').IntroStage;
var LoginStage = require('./stage').LoginStage;
var LobbyStage = require('./stage').LobbyStage;
var RoomStage = require('./stage').RoomStage;

var User = function(conn) {
	this.stage = null;
	this.conn = conn;
	this.name = '';	
	this.room = null;
}

util._extend(User.prototype, {
	start : function() {
		process.stdin.resume();
		var self = this;
		process.stdin.on('data', function(chunk) {
			self.command(chunk.toString());
		});
		
		this.stage = new IntroStage(this);
		this.stage.start();
	},
	end : function() {
		console.log('Á¾·áÁß..');
		this.conn.close();
	},
	nextStage : function(stage) {
		if (this.stage!=null) {
			this.print('['+(this.stage.name)+'] => ['+(stage.name)+']');
		}
		this.stage = stage;
		this.stage.start();
	},
	command: function(cmdline) {
		// global command
		cmdline = utils.trim(cmdline);
		if (cmdline[0]=='/') {
			var cmd = cmdline.substring(1).toLowerCase();
			if (cmd=='q') {
				this.print('quit');
				this.conn.close();
				return;
			}
		}
		this.stage.command(cmdline);
	},
	print: function(message) {
		process.stdout.write(message+'\n');
	},
	send: function(header, data) {
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
	},
	goLobby: function() {
		this.nextStage(new LobbyStage(this));
	},
	goRoom: function(room) {
		this.nextStage(new RoomStage(this, room));
	},
	
	// connection
	onConnect : function() {
		this.start();
	},
	onPacket: function(header, data) {
		//console.log('----------------------------------');
		//console.log('header:', header);
		//console.log('data:', data);
		
		this.stage.serverLink(header, data);
	},
	onPacketError: function(err) {
		console.log('packet_error:', err);
		this.conn.end();
	},
	onError: function(err) {
		console.log('err:' + err);
		console.log('err:' + err.message);
		this.conn.end();
	},
	onClose: function() {
		console.log('ÄÁ³Ø¼Ç ´ÝÈû');
		this.conn = null;
		
		process.stdin.pause();
	}
});

module.exports = User;