import express from 'express';
import ViteExpress from 'vite-express';
import passport from 'passport';
import GitHubStrategy from 'passport-github';

const app = express();

app.use(express.json());

passport.use(new GitHubStrategy({
  clientID: "ee68f2a2eb45c1602179",
  clientSecret: "c94bc95b579f85d6fb3836ffd9f675491e4a5519",
  callbackURL: "http://localhost:3000/auth/github/callback"
},
function(accessToken, refreshToken, profile, done) {
  //TODO Save user profile data into DB
  return done(null, profile);
}));

app.get('/auth/github', passport.authenticate('github'));

app.get('/callback', 
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication
    res.redirect('/');
  });



// replace with db connection
const data = [];

// Add function
app.post('/add', (req, res) => {
    const item = req.body;

    // TODO: Add database connection here to save the item
    data.push(item);

    res.status(200).send({ message: 'Item added successfully!' });
});

// Delete function
app.delete('/delete/:id', (req, res) => {
    const { id } = req.params;

    // TODO: Add database connection here to delete the item by its ID
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
        data.splice(index, 1);
        res.status(200).send({ message: 'Item deleted successfully!' });
    } else {
        res.status(404).send({ message: 'Item not found!' });
    }
});

ViteExpress.listen(app, 3000);
