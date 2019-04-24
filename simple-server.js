const http=require("http");

const server=http.createServer((req,res)=>{
    res.statusCode=200;
    res.setHeader("Content-Type","text/plain");
    res.end("Thanks for calling this API");    
});


server.listen(8080,'127.0.0.1',()=>{
    console.log("Server started. http://localhost:8080");
})

// learning
// Always use ()={}
/*
 Status codes and Description
 200    :   OK
 404    :   Not found
 500    :   Internal Server Error
 
 */