const assert=require("assert");
try{
    //assert.ok(75 > 70);
    assert.ok(70 > 75,"Value should be greater than 75");    
    //assert.strictEqual('Hello foobar', 'Hello World!',"Text Mismatch");

    console.log("Execution continued");
}catch(e){
    console.log(e.message);
}

//https://www.w3schools.com/nodejs/ref_assert.asp
