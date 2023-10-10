import express from  'express'
import ViteExpress from 'vite-express'
import axios from 'axios'
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
console.log(clientSecret)

const app = express();

// In-memory storage for user data
const users = [];

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

  res.redirect('/'); // Redirect user back to app
  console.log('Redirected user back to app.');
});

app.use(express.json());

ViteExpress.listen(app, 3000, () => {
  console.log('Server is running on http://localhost:3000');
});
