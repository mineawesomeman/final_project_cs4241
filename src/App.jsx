import './App.css';
import LoginComponent from './LoginComponent';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Room from './Room';

function App() {

    return (
        <>
    <Router>
      <Routes>
        <Route path="/" element={<LoginComponent />} />
        <Route path="/main" element={<Room />} />
      </Routes>
    </Router>
        </>
    );
}

export default App;
