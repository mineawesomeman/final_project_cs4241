import express from 'express'
import ViteExpress from 'vite-express'
import { createServer } from 'http'
import { Server } from 'socket.io'

let messagesLog = [];

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('dist'));


io.on('connection', (socket) => {
  console.log('a user connected');

  // Handle joining a chatroom
  socket.on('join-room', (room) => {
    socket.join(room);
  });

  // Handle sending a message
  socket.on('send-message', ({ room, message }) => {
    const timestamp = new Date().toISOString();
    console.log(`${room} (${timestamp}): ${message}`);

    // Store the message details
    /*
      Messages
        message_id: Primary Key, Auto-incremented
        building_id: Foreign Key referencing Buildings
        user_id: Foreign Key referencing Users
        message_content: Text content of the message
        timestamp: Date and time when the message was sent
        is_edited: Boolean, indicating if the message was edited 
    */
    const messageID = (messagesLog.length === 0) ? 0 : messagesLog[messagesLog.length - 1] + 1;
    const is_edited = false;
    const newMessage = {
      messageID,
      room,
      userid,
      message,
      timestamp,
      is_edited
    };
    messagesLog.push(newMessage);

    // Emit the new message to everyone in the room
    io.to(room).emit('receive-message', newMessage);
  });

  // Handle the request for historical messages
  socket.on('request-historical-messages', (room) => {
    console.log("request-historical-messages");
    const roomMessages = messagesLog.filter(msg => msg.room === room);
    socket.emit('historical-messages', roomMessages);
  });



  socket.on('leave-room', (room) => {
    socket.leave(room);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

httpServer.listen(3001, () => {
  console.log('http server started');
});

ViteExpress.listen(app, 3000)