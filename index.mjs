import Server from 'bare-server-node';
import express from 'express';
import nodeStatic from 'node-static';

const app = express()

const bare =  new Server('/bare/', '');
const serve = new nodeStatic.Server('html/');

app.get("/", (request, response) => {
    if (bare.route_request(request, response)) return true;
    serve.serve(request, response);
})

app.listen(process.env.PORT || 8443, ()=>{
    console.log(`Started on port ${process.env.PORT || 8443}`)
})