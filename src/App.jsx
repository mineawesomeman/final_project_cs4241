import { useState } from 'react';
import Chat from './Chat';
import './App.css'

function App() {
  const [count, setCount] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);

  return (
    <>
      <div className="card">
        <p>Select a chatroom:</p>
        <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
          <option value="">-- Select a room --</option>
          <option value="Room1">Room1</option>
          <option value="Room2">Room2</option>
          {/* Add more rooms as needed */}
        </select>
        {selectedRoom && <Chat room={selectedRoom} />}
      </div>
    </>
  )
}

export default App;
