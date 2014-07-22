/**
 * client.js
 * 클라이언트 프로그램
 * 
 * @require net
 */

// module
var util = require('util');
var net = require('net');

// include
var Connection = require('./common/connection');
var User = require('./client/user');

// connect
(function connect() {
	var port = 4001;
	var retryInterval = 3000;
	var retriedTimes = 0;
	var maxRetries = 10;
	
	function reconnect() {
		if (retriedTimes >= maxRetries) {
			throw new Error('최대 재시도 횟수 최과. 재접속 포기');
		}
		retriedTimes++;
		setTimeout(connect, retryInterval);
	}

	var socket = net.createConnection(port);
	var conn = new Connection(socket);
	var user = new User(conn);

	conn.on('connect', function() {
		user.onConnect();
		retriedTimes = 0;
	});
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

}());


