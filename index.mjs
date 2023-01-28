import createBareServer from './bare-server-node/createServer.ts';
import express from 'express';
import http from 'node:http';
import config from './config.json'

const httpServer = http.createServer();

const app = express();

app.get('/', (req, res) => {
	res.send('Hello, World!');
});

const bareServer = createBareServer('/html/');

httpServer.on('request', (req, res) => {
	if (bareServer.shouldRoute(req)) {
		bareServer.routeRequest(req, res);
	} else {
		app(req, res);
	}
});

httpServer.on('upgrade', (req, socket, head) => {
	if (bareServer.shouldRoute(req)) {
		bareServer.routeUpgrade(req, socket, head);
	} else {
		socket.end();
	}
});

httpServer.on('listening', () => {
	console.log('HTTP server listening');
});

httpServer.listen({
	port: config.port,
});