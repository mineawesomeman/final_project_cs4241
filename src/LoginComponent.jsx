import React from 'react';

function LoginComponent() {
  const handleGitHubLogin = async () => {
    const clientID = 'ee68f2a2eb45c1602179';
    const redirectURI = 'http://66.189.31.92:3000/auth/github/callback'; // change when we move to DO
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientID}&redirect_uri=${redirectURI}`;
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <button onClick={handleGitHubLogin}>Login with GitHub</button>
    </div>
  );
}

export default LoginComponent;
