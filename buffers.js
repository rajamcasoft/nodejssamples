//Node provides Buffer class which provides instances to store raw data similar to an array of integers but corresponds to a raw memory allocation outside the V8 heap.


const buf1 = Buffer.from('buffer');
console.log(buf1.toString());


const buf2 = Buffer.from('buffer');
const buf3 = Buffer.from(buf1);

buf2[0] = 0x61;//Replaces first character as a

console.log(buf2.toString());
// Prints: auffer
console.log(buf3.toString());
// Prints: buffer