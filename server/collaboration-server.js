/**
 * Yjs WebSocket Collaboration Server
 */

const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 1234;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Yjs Collaboration Server\n');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  const docName = req.url.slice(1).split('?')[0] || 'default';
  console.log(`Client connected to room: ${docName}`);
  try {
    setupWSConnection(conn, req, { docName });
  } catch (e) {
    console.error('Error setting up connection:', e);
  }
});

server.listen(port, host, () => {
  console.log(`Collaboration server running at ws://${host}:${port}`);
});
