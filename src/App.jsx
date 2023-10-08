import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LoginComponent from './LoginComponent';


function App() {
  const [count, setCount] = useState(0)

return (
    <>
      <LoginComponent />
      {/* ... other components ... */}
    </>
  );
}

export default App

