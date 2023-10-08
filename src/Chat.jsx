import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

function Chat({ room }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const socketRef = useRef(null);
    const [prevRoom, setPrevRoom] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        console.log("useEffect");
        setMessages([]);
        if (room) {
            setPrevRoom(room);
        }
        if (!connected) {
            socketRef.current = io.connect('http://localhost:3001');
            setConnected(true);
        }

        if (prevRoom != null) {
            socketRef.current.emit('leave-room', prevRoom);
        }
        socketRef.current.emit('join-room', room);

        socketRef.current.emit('request-historical-messages', room);
        socketRef.current.on('historical-messages', (historicalMessages) => {
            console.log("historical-message");
            console.log(messages);
            console.log(historicalMessages);
            setMessages(historicalMessages);
        });

        socketRef.current.on('receive-message', (message) => {
            console.log("Received message:", message);
            setMessages((prev) => [...prev, message]);
         });
         

        return () => {
            socketRef.current.off('historical-messages');
            socketRef.current.off('receive-message');
        };


    }, [room]);


    useEffect(() => {
        return () => {
            socketRef.current.disconnect();
            setConnected(false);
        };
    }, []);

    const sendMessage = () => {
        console.log(room + ' : ' + input);
        socketRef.current.emit('send-message', { room, message: input });
        
        // Use setMessages to update the state
        const newMessage = {
            message: input,
            room,
            timestamp: new Date().toISOString()
          };
          setMessages((prev) => [...prev, newMessage]);          
        
        setInput('');
        console.log('Sent Message : ' + newMessage);
    };

    return (
        <div>
            <h2>{room}</h2>
            <div>
                {messages.map((messageObj, index) => (
                    <div key={index}>
                        <p>{messageObj.room} ({messageObj.timestamp}): {messageObj.message}</p>
                    </div>
                ))}
            </div>
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                type="text"
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
}

export default Chat;
