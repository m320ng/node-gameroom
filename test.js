/**
 * test.js
 */

// module
var util = require('util');
var fs = require('fs');

// include

// test
(function test() {
	// test-module exec
	fs.readdir('./test', function(err, files) {
		if (err) {
			console.log('err:',err);
			return;
		}
		files.forEach(function(file) {
			var testMod = require('./test/'+file);
			if (testMod && testMod.test) {
				testMod.test();
			}
		});
	});
}());
