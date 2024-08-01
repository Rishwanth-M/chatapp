const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('a user connected');

  // Listen for a new user joining
  socket.on('new user', (username) => {
    socket.username = username;
    io.emit('chat message', `${username} has joined the chat`);
  });

  // Listen for chat messages
  socket.on('chat message', (msg) => {
    io.emit('chat message', { user: socket.username, message: msg });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (socket.username) {
      io.emit('chat message', `${socket.username} has left the chat`);
    }
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
