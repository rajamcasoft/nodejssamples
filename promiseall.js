/*const one=()=>{
    return new Promise(function(resolve,reject){
        reject("Thanks");
    });

}

one().then(function(result){
    console.log(result);
}).catch(function(error){
    console.log("ERROR:"+error);
});
*/


const one=()=>{
    return new Promise(function(resolve,reject){
        resolve("One");
    });

};

const two=()=>{
    return new Promise(function(resolve,reject){
        resolve("Two");
    });

};


Promise.all([one(),two()]).then(function(res){
    console.log(res);
}).catch(function(err){
    console.log(err);
});

