import express from  'express'
import ViteExpress from 'vite-express'
import axios from 'axios'
const clientSecret = process.env.GITHUB_CLIENT_SECRET;


const app = express()
app.get('/auth/github/callback', async (req, res) => {
  const code = req.query.code;

  
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

  // Fetch user data from GitHub
  const userResponse = await axios.get('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${accessToken}`
    }
  });

  const userData = userResponse.data;

  //TODO store the user data in your database and create a session or JWT for the user

  res.redirect('/'); // Redirect user back to app
});


app.use( express.json() )


ViteExpress.listen( app, 3000 )
