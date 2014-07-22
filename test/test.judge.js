/**
 * test.judge.js
 */

// module
 var util = require('util');

// include
var proto = require('../common/protocol');
var PokerGame = require('../server/poker_game').PokerGame;
var PokerGameState = require('../server/poker_game').PokerGameState;

function TestJudge() {
	this.game = new PokerGame();
}
TestJudge.prototype = {
	test: function() {
		this.game.reset();
		var cardset = [];

		// random
		for (var i=0; i<5; i++) {
			var card = this.game.popCard();

			console.log('card:',card);
			console.log('card:',card.text());
			cardset.push(card);
		}
		console.log(this.game.judgeCardset(cardset));

		// triple
		var cardset = [];
		for (var i=0; i<5; i++) {
			var card = this.game.popCard();
			
			if (i<3) card.number = 9;
			if (i>=3&&i<6) card.number = 1;

			console.log('card:',card);
			console.log('card:',card.text());
			cardset.push(card);
		}
		console.log(this.game.judgeCardset(cardset));

		// straight
		var cardset = [];
		cardset.push({
			number:6,
			shape:1
		});
		cardset.push({
			number:2,
			shape:1
		});
		cardset.push({
			number:3,
			shape:1
		});
		cardset.push({
			number:4,
			shape:1
		});
		cardset.push({
			number:5,
			shape:1
		});
		console.log(this.game.judgeCardset(cardset));

		// back-straight
		var cardset = [];
		cardset.push({
			number:13,
			shape:1
		});
		cardset.push({
			number:1,
			shape:2
		});
		cardset.push({
			number:2,
			shape:1
		});
		cardset.push({
			number:3,
			shape:1
		});
		cardset.push({
			number:4,
			shape:1
		});
		console.log(this.game.judgeCardset(cardset));

		// mountain
		var cardset = [];
		cardset.push({
			number:13,
			shape:1
		});
		cardset.push({
			number:12,
			shape:1
		});
		cardset.push({
			number:11,
			shape:3
		});
		cardset.push({
			number:10,
			shape:1
		});
		cardset.push({
			number:9,
			shape:1
		});
		console.log(this.game.judgeCardset(cardset));
	}
}

module.exports = new TestJudge;