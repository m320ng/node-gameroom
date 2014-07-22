/**
 * utils.js
 * UTIL
 *
 */

function trim(string) {
	return string.replace(/^\s*|\s*$/g, '')
}

function shuffle(arr) {
    var counter = arr.length, temp, index;

    // While there are elements in the arr
    while (counter--) {
        // Pick a random index
        index = (Math.random() * counter) | 0;

        // And swap the last element with it
        temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }

    return arr;
}
module.exports = {
	trim: trim,
	shuffle: shuffle
}
