import LoginComponent from './LoginComponent';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Room from './Room';
import SelectionPage from './SelectionPage'

function App() {

    return (
        <>
    <Router>
      <Routes>
        <Route path="/" element={<LoginComponent />} />
        <Route path="/main" element={<SelectionPage />} />
      </Routes>
    </Router>
        </>
    );
}

export default App;
