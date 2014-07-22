/**
 * protocol.js
 * header Á¤ÀÇ
 */

var Echo = {
	PK_ECHO: 255
};

var Global = {
	PK_NOP: 1, 
	PK_CONNECT: 2, 
	PK_CRITICALERROR: 3
};

var Login = {
	PK_LOGIN: 100
};

var Lobby = {
	PK_LOBBY_CHAT: 101,
	PK_ROOM_LIST: 102,
	PK_MAKE_ROOM: 103,
	PK_ENTER_ROOM: 104
};

var Room = {
	PK_ROOM_CHAT: 201,
	PK_USER_LIST: 202,
	PK_NEW_USER: 203,
	PK_LEAVE_USER: 204,
	PK_LEAVE_ROOM: 205
};

var Game = {
	PK_START_GAME: 1001,
	PK_ALLOW_START_GAME: 1002,
	PK_READY_GAME: 1003,
	PK_PLAYER_READY_GAME: 1004,

	PK_POKER_START: 1005,
	PK_FIRST_CARD: 1006,
	PK_LAST_CARD: 1007,
	PK_SELECT_CARD: 1008,
	PK_GIVE_CARD: 1009,
	PK_RECEIVE_CARD: 1010,
	PK_YOUR_TURN: 1011,
	PK_PLAYER_TURN: 1012,
	PK_SELECT_BETTING: 1013,
	PK_SELECT_GIVEUP: 1014,
	PK_COMPLETE_GAME: 1015
};

var util = require('util');

var Protocol = {};
Protocol = util._extend(Protocol, Echo);
Protocol = util._extend(Protocol, Global);
Protocol = util._extend(Protocol, Login);
Protocol = util._extend(Protocol, Lobby);
Protocol = util._extend(Protocol, Room);
Protocol = util._extend(Protocol, Game);

module.exports = Protocol
