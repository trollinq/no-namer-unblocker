var config = require("./config.json")

var express = require("express")
var fs = require("fs")
var serveStatic = require( "serve-static" );

var app = express()

try{
    var unblockerModule = require('unblocker');
    var unblocker = new unblockerModule({prefix: '/nu/'});
    app.use(unblocker);
}catch(err){
    console.log(`[!] error occured while setting up "node-unblocker"; error: ${err}`)
}

app.use('/', serveStatic('./html'));
app.get("/", async(req, res)=>{
    res.set('Content-Type', 'text/html');
    res.end(await fs.readFileSync("./html/index.html", "utf-8"))
})

app.listen(config.port||8000, ()=>{console.log(`[*] Started on port ${config.port||8000}`)})