/**
 * connection.js
 * 
 * @require util
 * @event connect
 * @event packet
 * @event packet_error
 * @event close
 * @event error
 */

/**
 * 패킷의 구조
 *
 * | LENGTH | HEADER | MASK  | DATA
 * +--------+--------+-------+--------------
 * | 2byte  | 2byte  | 2byte | ...
 * 
 * LENGTH: LENGTH와 HEADER까지 포함한 전체 총길이 (16-LE)
 * HEADER: protocol.js 에 정의된 헤더 (16-LE)
 * MASK: LENGTH와 HEADER를 마스킹 (검증용)
 * DATA: 나머지 데이터
 */

// module
var util = require('util');

// include
var EventEmitter = require('events').EventEmitter;

// vars
var debug = false;

var Connection = function(socket) {
	// fields
	this.socket = socket;
	this.recvBuffer = null;
	this.recvBufferIdx = 0;

	// events
	var self = this;
	this.socket.on('connect', function() {
		self.onConnect();
	});
	this.socket.on('data', function(data) {
		self.onData(data);
	});
	this.socket.on('error', function(err) {
		self.onError(err);
	});
	this.socket.on('close', function() {
		self.onClose();
	});
}

util.inherits(Connection, EventEmitter);

util._extend(Connection.prototype, {
	/* socket 
	------------------------------------------------------------------------------------ */
	write: function() {
		this.socket.write.apply(this.socket, arguments);
	},
	end: function() {
		this.socket.end.apply(this.socket, arguments);
	},
	resume: function() {
		this.socket.resume.apply(this.socket, arguments);
	},
	pause: function() {
		this.socket.pause.apply(this.socket, arguments);
	},

	/* method
	------------------------------------------------------------------------------------ */
	close: function(header, data) {
		if (header) {
			var buffer = this.makePacket(header, data);
			this.socket.end(buffer);
		} else {
			this.socket.end();
		}
	},
	send: function(header, data) {
		var buffer = this.makePacket(header, data);
		this.socket.write(buffer);
	},
	makePacket: function(header, data) {
		if (data && !Buffer.isBuffer(data)) data = new Buffer(data);

		var dataLen = 0;
		if (data) dataLen = data.length;
		var buffer = new Buffer(2 + 2 + 2 + dataLen);
		buffer.writeUInt16LE(buffer.length, 0);
		buffer.writeUInt16LE(header, 2);
		buffer.writeUInt8(buffer.readUInt8(0)^buffer.readUInt8(2), 4);
		buffer.writeUInt8(buffer.readUInt8(1)^buffer.readUInt8(3), 5);
		if (data) data.copy(buffer, 6);
		return buffer;
	},

	/* event
	------------------------------------------------------------------------------------ */
	onConnect: function() {
		this.emit('connect');
	},
	/**
	 * 패킷이 완성되었을때 호출된다
	 * @param packet Buffer
	 */
	onPacket: function(packet) {
		if (debug) console.log('>>>>packet:', packet);

		var length = packet.readUInt16LE(0);
		var header = packet.readUInt16LE(2);
		var mask = packet.readUInt16LE(4);
		var data = packet.slice(6);

		this.emit('packet', header, data);
	},
	onData: function(data) {
		var buffer = new Buffer(data);

		if (debug) {
			console.log('buffer-length:',buffer.length);
			console.log(data);
			console.log(buffer);
		}

		if (this.recvBuffer != null && this.recvBuffer.length == 1) {
			buffer = Buffer.concat([this.recvBuffer, buffer]);
			this.recvBuffer = null;
			this.recvBufferIdx = 0;
		}

		if (this.recvBuffer==null) {
			if (buffer.length < 2) {
				this.recvBuffer = new Buffer(buffer);
				return;
			}

			var length = buffer.readUInt16LE(0);
			if (length < 6) {
				this.emit('packet_error', {
					code: 'WRONGLEN',
					message: '올바른 패킷이 아닙니다.'
				});
			}
			if (debug) console.log('>>>>packet-length:', length);
			this.recvBuffer = new Buffer(length);
			this.recvBufferIdx = 0;
		}

		var copied = buffer.copy(this.recvBuffer, this.recvBufferIdx);
		this.recvBufferIdx += copied;

		if (this.recvBufferIdx >= 4) {
			var header = this.recvBuffer.readUInt16LE(2);
			// header 검증
		}
		if (this.recvBufferIdx >= 6) {
			var length1 = this.recvBuffer.readUInt8(0);
			var length2 = this.recvBuffer.readUInt8(1);
			var header1 = this.recvBuffer.readUInt8(2);
			var header2 = this.recvBuffer.readUInt8(3);
			var mask1 = this.recvBuffer.readUInt8(4);
			var mask2 = this.recvBuffer.readUInt8(5);
			// mask
			if ((length1^header1) != mask1 || (length2^header2) != mask2) {
				this.emit('packet_error', {
					code: 'WRONGMASK',
					message: '올바른 패킷이 아닙니다.'
				});
			}
		}

		if (this.recvBufferIdx==this.recvBuffer.length) {
			if (this.recvBuffer.length >= 6) {
				this.onPacket(this.recvBuffer);
			}
			
			if (debug) console.log('recv <= null');
			this.recvBuffer = null;
			this.recvBufferIdx = 0;
		}

		if (copied < buffer.length) {
			buffer = buffer.slice(copied);
			this.onData(buffer);
		}
	},
	onError: function(err) {
		this.emit('error', err);
	},
	onClose: function() {
		this.emit('close');
		this.socket = null;
	}
});

module.exports = Connection;
