import express from  'express'
import ViteExpress from 'vite-express'
import axios from 'axios'
const clientSecret = process.env.GITHUB_CLIENT_SECRET;

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

  // Store user data in local storage
  const user = {
    github_oauth_id: githubUserData.id,
    username: githubUserData.login,
    display_name: githubUserData.name || githubUserData.login,
    joined_date: new Date().toISOString()
  };
  users.push(user);

  console.log('Stored user in local storage:', user);

  res.redirect('/'); // Redirect user back to app
  console.log('Redirected user back to app.');
});

app.use(express.json());

ViteExpress.listen(app, 3000, () => {
  console.log('Server is running on http://localhost:3000');
});
