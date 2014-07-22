/**
 * server.js
 * 서버 프로그램
 *
 */

var os = require('os');
/*
console.log(os.platform());
console.log(os.arch());
console.log(os.totalmem());
console.log(os.freemem());
console.log(os.cpus());
console.log(os.networkInterfaces());
*/

global._world = require('./server/world');
_world.config({
	port: 4001
});
_world.start();
