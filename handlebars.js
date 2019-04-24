var handlebar=require("handlebars");
var fs= require('fs');
var http=require("http");


var server=http.createServer((req,res)=>{
    fs.readFile('handlebar-template.html','utf-8',function(err,filecontent){
        var template = handlebar.compile(filecontent);
        var html = template(dbData);
        res.end(html);

   });

   
});


server.listen(8080,'127.0.0.1',()=>{
    console.log("server started successfull");
})


var dbData = {
    title: 'practical node.js',
    author: 'P.Raja',
    tags: ['express', 'node', 'javascript']
  }


  