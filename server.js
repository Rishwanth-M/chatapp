const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const rooms = {}; // Stores messages and users by unique code
const userMap = {}; // Maps socket IDs to usernames and unique codes

io.on('connection', (socket) => {
  console.log('a user connected');

  // Initialize user data in userMap
  userMap[socket.id] = { username: null, room: null };

  // Handle a new user joining
  socket.on('new user', (username) => {
    socket.username = username;
    userMap[socket.id].username = username;
    io.emit('chat message', { user: 'System', message: `${username} has joined the chat` });
  });

  // Handle setting a unique code (joining a room)
  socket.on('set code', (code) => {
    if (userMap[socket.id].room) {
      socket.leave(userMap[socket.id].room);
    }

    // Save new room information
    socket.room = code;
    socket.join(code);

    userMap[socket.id].room = code;

    if (rooms[code]) {
      // Check if the username matches the one in the room
      const roomUsers = new Set();
      for (let id in userMap) {
        if (userMap[id].room === code) {
          roomUsers.add(userMap[id].username);
        }
      }

      // If no matching username found, clear chat history
      if (!roomUsers.has(socket.username)) {
        rooms[code] = [];
      }

      socket.emit('previous messages', rooms[code]); // Send previous messages to the user
    } else {
      rooms[code] = [];
    }

    io.to(code).emit('chat message', { user: 'System', message: `${socket.username} has joined the chat` });
  });

  // Handle chat messages
  socket.on('chat message', (data) => {
    const { message, uniqueCode } = data;
    if (userMap[socket.id].room === uniqueCode) {
      const msg = { user: socket.username, message: message, uniqueCode: uniqueCode };
      if (!rooms[uniqueCode]) {
        rooms[uniqueCode] = [];
      }
      rooms[uniqueCode].push(msg);
      io.to(uniqueCode).emit('chat message', msg);
    } else {
      socket.emit('chat message', { user: 'System', message: 'You are not in the correct room to send this message.' });
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    if (userMap[socket.id].username && userMap[socket.id].room) {
      io.to(userMap[socket.id].room).emit('chat message', { user: 'System', message: `${userMap[socket.id].username} has left the chat` });
    }
    delete userMap[socket.id];
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
