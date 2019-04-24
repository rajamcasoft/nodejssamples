var currentTime=Date.now();
//console.log(currentTime);

setTimeout(()=>{
    var latest=Date.now();
    var diff=latest-currentTime;
    console.log("Difference: "+diff);
},100);
