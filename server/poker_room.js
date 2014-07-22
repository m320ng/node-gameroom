/**
 * poker_room.js
 * 포커게임룸
 * 
 */

// module
 var util = require('util');

// include
var proto = require('../common/protocol');
var PokerGame = require('./poker_game').PokerGame;
var PokerGameStage = require('./poker_game').PokerGameStage;

var PokerRoom = function(no, lobby) {
	this.lobby = lobby;
	this.type = 'poker';
	this.no = no;
	this.users = [];
	this.captain = null;

	this.game = new PokerGame(this);
	this.ableStart = false;
	this.giveCardCount = 0;
	this.turn = 0;
};

util._extend(PokerRoom.prototype, {
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

		var pokerGameStage = new PokerGameStage(user, this.game);
		pokerGameStage.oldStage = user.stage;
		user.stage = pokerGameStage;
		console.log('user.stage:',user.stage.name);

		return null;
	},
	leave: function(user) {
		user.stage = user.stage.oldStage;

		this.broadcast(function(other) {
			other.stage.sendLeaveUser(user);
		}, user);
		user.stage.sendLeaveRoom();

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
		if (this.game) {
			this.game.free();
			this.game = null;
		}
		this.users.forEach(function(user) {
			user.game = null;
			user.goLobby();
		});
	},
	chat: function(user, message) {
		this.broadcast(function(other) {
			other.stage.sendRoomChat(user, message);
		}, user);
	},

	requestStartGame: function(user) {
		if (!this.ableStart) {
			user.stage.sendStartGame({success:false, message:'all user not READY'});
			return;
		} 
		this.broadcast(function(other) {
			other.stage.sendAllowStartGame();
		});
	},
	checkAllowStart: function() {
		console.log('checkAllowStart');
		var check = 0;
		this.users.forEach(function(user) {
			if (user.stage.allowStart) {
				check++;
			}
		});
		if (check==this.users.length) {
			this.startGame();
		} else {
			console.log('check==this.users.length:', check,'==',this.users.length);
		}
	},
	readyUser: function(user) {
		var check = 0;
		this.users.forEach(function(user) {
			if (user.stage.ready) {
				check++;
			}
		});
		if (check==this.users.length) {
			this.ableStart = true;
		}

		this.broadcast(function(other) {
			other.stage.sendPlayerReadyGame(user);
		}, user);
	},
	startGame: function(user) {
		//if (user!=this.captain) {
		//	return;
		//}
		this.game.reset();

		this.broadcast(function(other) {
			other.stage.sendPokerStart();
		});
		this.giveCard();
	},

	giveCard: function(user) {
		var self = this;
		this.users.forEach(function(user) {
			user.stage.receiveCard = false;

			var card = self.game.popCard();
			user.stage.cardset.push(card);
			user.stage.sendGiveCard();
		});
		this.giveCardCount++;
	},
	checkReceiveCard: function() {
		var check = 0;
		this.users.forEach(function(user) {
			if (user.stage.receiveCard) {
				check++;
			}
		});

		if (check==this.users.length) {
			if (this.giveCardCount < 5) {
				this.giveCard();
				return;
			}

			this.nextTurn(true);
		}
	},

	nextTurn: function(first) {
		if (!first) {
			this.turn++;
			if (this.turn==this.users.length) {
				this.judgeGame();
				return;
			}
		}
		var user = this.users[this.turn];
		user.stage.sendYourTurn();
		this.broadcast(function(other) {
			other.stage.sendPlayerTurn();
		}, user);
	},

	selectBetting: function(user) {
		this.broadcast(function(other) {
			other.stage.sendSelectBetting();
		}, user);
		this.nextTurn();
	},
	selectGiveUp: function(user) {
		this.broadcast(function(other) {
			other.stage.sendSelectGiveup();
		}, user);
		this.nextTurn();
	},

	judgeGame: function() {
		var winner = null;
		var winjudge = null;
		var judgeVal = 0;
		var self = this;
		this.users.forEach(function(user) {
			var judge = self.game.judgeCardset(user.stage.cardset);
			if (judgeVal < judge.value) {
				judgeVal = judge.value;
				winner = user;
				winjudge = judge;
			}
		});
		console.log('winner is ' + winner.nickname);
		console.log(winjudge);
		this.broadcast(function(other) {
			other.stage.sendCompleteGame(winner, winjudge);
		});
		this.finishGame();
	},

	finishGame: function() {
		console.log('finish game');
		this.turn = 0;
		this.giveCardCount = 0;
		this.users.forEach(function(user) {
			user.stage.reset();
		});
		
		this.ableStart = false;
	}
});

module.exports = PokerRoom;