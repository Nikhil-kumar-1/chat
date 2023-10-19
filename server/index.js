const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io'); // Import Server from socket.io

app.use(cors()); // Enable CORS
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Adjust the origin as needed
    methods: ['GET', 'POST'],
  },
});

const CHAT_BOT = 'ChatBot'; // Define a chat bot username

// Keep track of connected users and rooms
const allUsers = [];

io.on('connection', (socket) => {
  console.log(`User connected ${socket.id}`);

  // Handle user joining a room
  socket.on('join_room', (data) => {
    const { username, room } = data;
    socket.join(room); // Add the user to a socket room

    const createdTime = Date.now(); // Current timestamp

    // Send a welcome message to the user who just joined
    socket.emit('receive_message', {
      message: `Welcome ${username}`,
      username: CHAT_BOT,
      createdTime,
    });

    // Send a message to all users in the room (except the new user) to inform about the join
    socket.to(room).emit('receive_message', {
      message: `${username} has joined the chat room`,
      username: CHAT_BOT,
      createdTime,
    });

    // Update the list of chat room users and send it to all room members
    allUsers.push({ id: socket.id, username, room });
    const chatRoomUsers = allUsers.filter((user) => user.room === room);
    io.to(room).emit('chatroom_users', chatRoomUsers);
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    const disconnectedUser = allUsers.find((user) => user.id === socket.id);
    if (disconnectedUser) {
      const { username, room } = disconnectedUser;
      allUsers.splice(allUsers.indexOf(disconnectedUser), 1);

      const createdTime = Date.now();

      // Send a message to inform other users in the room about the disconnection
      socket.to(room).emit('receive_message', {
        message: `${username} has left the chat room`,
        username: CHAT_BOT,
        createdTime,
      });

      // Update the list of chat room users and send it to all room members
      const chatRoomUsers = allUsers.filter((user) => user.room === room);
      io.to(room).emit('chatroom_users', chatRoomUsers);
    }
  });
});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
