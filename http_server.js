import express from 'express'
import ViteExpress from 'vite-express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import axios from 'axios'
import dotenv from 'dotenv';
dotenv.config();
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const socketToUserData = new Map();

let messagesLog = [];
const users = [];

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

  socket.on('set-user', (userid, callback) => {
    console.log("User ID received:", userid);
    if (userid != null) {
    socketToUserData.set(socket.id, userid);
    callback('User ID received successfully.');
    } else {
      callback('error');
    }
  });

  // Handle joining a chatroom
  socket.on('join-room', (room) => {
    socket.join(room);
  });

  // Handle sending a message
  socket.on('send-message', ({ room, message }) => {
    const user = socketToUserData.get(socket.id);
    if (!user) {
      console.error('User not found for socket:', socket.id);
      return;
    }
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
      user,
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
    socketToUserData.delete(socket.id);
  });
});

httpServer.listen(3001, () => {
  console.log('http server started');
});

app.get('/auth/github/callback', async (req, res) => {
  console.log('Received GitHub callback request.');

  const code = req.query.code;

  console.log('Exchanging GitHub code for access token...');
  // Exchange code for access token
  const response = await axios.post('https://github.com/login/oauth/access_token', {
    client_id: 'ee68f2a2eb45c1602179',
    client_secret: clientSecret,
    code: code
  }, {
    headers: {
      'Accept': 'application/json'
    }
  });

  const accessToken = response.data.access_token;
  console.log('Received access token from GitHub.');

  console.log('Fetching user data from GitHub...');
  // Fetch user data from GitHub
  const userResponse = await axios.get('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${accessToken}`
    }
  });

  const githubUserData = userResponse.data;
  console.log('Received user data from GitHub:', githubUserData);

  /*
Will stay in callback
const user = {
    github_oauth_id: githubUserData.id,
    username: githubUserData.login,
    display_name: githubUserData.name || githubUserData.login,
    joined_date: new Date().toISOString()
  };

  try {
    const savedUser = await addUserToDatabase(user);
    console.log('User saved to database:', savedUser);
  } catch (err) {
    console.error('Error saving user to database:', err);
  }

  */

  // Store user data in local storage- will be deleted
  const user = {
    github_oauth_id: githubUserData.id,
    username: githubUserData.login,
    display_name: githubUserData.name || githubUserData.login,
    joined_date: new Date().toISOString()
  };
  users.push(user);
  console.log('Stored user in local storage:', user);

  //end of deleted portion

  /*
  Digital Ocean replacement-connection template for postgresql
const { Pool } = require('pg');

const pool = new Pool({
  user: 'your_db_username',
  host: 'your_db_host',
  database: 'your_db_name',
  password: 'your_db_password',
  port: your_db_port
});


  */

  /*
  Adding new user data to db after oauth
async function addUserToDatabase(user) {
  try {
    const query = `
      INSERT INTO users(github_oauth_id, username, display_name, joined_date)
      VALUES($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [user.github_oauth_id, user.username, user.display_name, user.joined_date];

    const result = await pool.query(query, values);
    return result.rows[0]; // Returns the inserted user
  } catch (err) {
    console.error('Error inserting user into database:', err);
    throw err;
  }
}

  */

  /*
SQL CODE for creating table:
CREATE TABLE users (
  github_oauth_id BIGINT UNIQUE NOT NULL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  joined_date TIMESTAMP NOT NULL
);

  */
  // Return the user data in the HTTP response
  res.cookie('userData', JSON.stringify(user));
  res.redirect('/main'); // Redirect user back to app
  console.log('Redirected user back to app.');
});

app.get('/get-username', (req, res) => {
  const { userid } = req.query;
  console.log("Finding username of user with id " + userid);

  // Find the user in the users array
  const user = users.find(u => u.github_oauth_id === parseInt(userid));
  console.log("username " + user.username);

  if (user) {
    res.json({ username: user.username });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});


app.use(express.json());

ViteExpress.listen(app, 3000, () => {
  console.log('Server is running on http://localhost:3000');
});