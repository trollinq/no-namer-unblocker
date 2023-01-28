var loadJSON = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));

import fs from "fs";
import express from "express";
import unblockerModule from "unblocker";
import serveStatic from "serve-static";

var config =  loadJSON("./config.json")
var app = express();

app.use(serveStatic("./public"))
app.use(unblockerModule({
    prefix: '/nu/'
}))

app.listen((config.port||8080),(()=>{
    console.log(`[*] Started on port ${(config.port||8080)}`)
}));

process.on('uncaughtException', function (err) {
    console.log(`[!] error occured during script! error: ${err}`);
}); 