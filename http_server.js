import express from 'express'
import ViteExpress from 'vite-express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import axios from 'axios'
import dotenv from 'dotenv';
dotenv.config();
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const socketToUserData = new Map();
let globalGithubOAuthID = null;


import pkg from 'pg';
const { Pool } = pkg;


const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'ABMARTIN',
  port: 5432
});

async function addUserToDatabase(user) {
  try {
    // Check if the user already exists in the database based on their GitHub OAuth ID
    const checkQuery = 'SELECT * FROM users WHERE github_oauth_id = $1;';
    const checkResult = await pool.query(checkQuery, [user.github_oauth_id]);

    if (checkResult.rows.length > 0) {
      // User already exists; return the existing user
      return checkResult.rows[0];
    }

    // User doesn't exist; insert them into the database
    const insertQuery = `
      INSERT INTO users(github_oauth_id, username, display_name, joined_date)
      VALUES($1, $2, $3, $4)
      RETURNING *;
    `;

    const insertValues = [user.github_oauth_id, user.username, user.display_name, user.joined_date];

    const result = await pool.query(insertQuery, insertValues);
    return result.rows[0]; // Returns the inserted user
  } catch (err) {
    console.error('Error inserting user into database:', err);
    throw err;
  }
}

async function getHistoricalMessagesFromDatabase(room) {
  try {
    const query = `
      SELECT * FROM messages
      WHERE room = $1
      ORDER BY timestamp;
    `;
    const result = await pool.query(query, [room]);

    // Return the result as JSON
    return result.rows;
  } catch (err) {
    console.error('Error retrieving historical messages from database:', err);
    throw err;
  }
}

async function insertMessageIntoDatabase(user, room, message, timestamp, socket) {
  try {
    const userData = socketToUserData.get(socket.id);
    if (!userData || !userData.user_id) {
      console.error('User not found for socket:', socket.id);
      return null; // Return null or handle the case when the user is not found
    }

    const user_id = userData.user_id; // Retrieve the user_id from the user object

    const query = `
      INSERT INTO messages(user_id, room, message_content, timestamp, is_edited)
      VALUES($1, $2, $3, $4, $5)
      RETURNING message_id;
    `;

    const values = [user_id, room, message, timestamp, false];

    const result = await pool.query(query, values);
    return result.rows[0].message_id;
  } catch (err) {
    console.error('Error inserting message into database:', err);
    throw err;
  }
}



// Function to retrieve a message from the database
async function getMessageFromDatabase(messageID) {
  try {
    const query = 'SELECT * FROM messages WHERE message_id = $1;';
    const result = await pool.query(query, [messageID]);
    return result.rows[0];
  } catch (err) {
    console.error('Error retrieving message from database:', err);
    throw err;
  }
}



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
      socketToUserData.set(socket.id, { user_id: userid }); // Store user_id as an object
      callback('User ID received successfully.');
    } else {
      callback('error');
    }
  });


  socket.on('join-room', (room) => {
    socket.join(room);
    socket.emit('request-historical-messages', room);
  });


// Handle sending a message
  socket.on('send-message', async ({ room, message }) => {
    const user = socketToUserData.get(socket.id);
    if (!user) {
      console.error('User not found for socket:', socket.id);
      return;
    }
    const timestamp = new Date().toISOString();
    console.log(`${room} (${timestamp}): ${message}`);

    // Pass the 'socket' object as a parameter to 'insertMessageIntoDatabase'
    try {
      const messageID = await insertMessageIntoDatabase(user, room, message, timestamp, socket);

      // Retrieve the newly inserted message from the database
      const newMessage = await getMessageFromDatabase(messageID);

      // Emit the new message to everyone in the room
      io.to(room).emit('receive-message', newMessage);
    } catch (err) {
      console.error('Error sending message:', err);
      // Handle the error and send an appropriate response
      // You may want to emit an error event to the client here
    }
  });

  // Handle the request for historical messages
  socket.on('request-historical-messages', async (room) => {
    console.log("request-historical-messages");
    try {
      const roomMessages = await getHistoricalMessagesFromDatabase(room);
      socket.emit('historical-messages', roomMessages);
    } catch (err) {
      console.error('Error handling request for historical messages:', err);
      // Handle the error and send an appropriate response
      // You may want to emit an error event to the client here
    }
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

  const user = {
    github_oauth_id: githubUserData.id,
    username: githubUserData.login,
    display_name: githubUserData.name || githubUserData.login,
    joined_date: new Date().toISOString(),
  };

  // Set the global variable to store the GitHub OAuth ID
  globalGithubOAuthID = githubUserData.id;

  try {
    const savedUser = await addUserToDatabase(user);
    console.log('User saved to database:', savedUser);

    // Set the user data in a cookie
    res.cookie('userData', JSON.stringify(savedUser));
    // Redirect user back to app
    res.redirect('/main'); // This is the only place where you should send a response
    console.log('Redirected user back to app.');
  } catch (err) {
    console.error('Error saving user to database:', err);
    // Handle the error and send an appropriate response
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/get-historical-messages', async (req, res) => {
  const { room } = req.query;
  try {
    const roomMessages = await getHistoricalMessagesFromDatabase(room);
    res.json(roomMessages);
  } catch (err) {
    console.error('Error handling request for historical messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/logout', (req, res) => {
  res.cookie('userData', "")
  res.redirect('/')
  console.log('logging user out')
})

app.get('/get-username', async (req, res) => {
  let { userid } = globalGithubOAuthID;

  console.log("Finding username of user with id " + globalGithubOAuthID);

  try {
    userid=globalGithubOAuthID;
    const user = await getUserFromDatabase(userid);
    console.log("username " + user.username);

    if (user) {
      res.json({ username: user.username });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error('Error retrieving user from database:', err);
    // Handle the error and send an appropriate response
    res.status(500).json({ error: 'Internal server error' });
  }
});


async function getUserFromDatabase(userid) {
  try {
    const query = 'SELECT * FROM users WHERE github_oauth_id = $1;';
    const result = await pool.query(query, [parseInt(userid)]);
    return result.rows[0];
  } catch (err) {
    console.error('Error retrieving user from database:', err);
    throw err;
  }
}


app.use(express.json());

ViteExpress.listen(app, 3000, () => {
  console.log('Server is running on http://localhost:3000');
});