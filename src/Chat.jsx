import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Cookies from 'js-cookie';

function Chat({ room }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const socketRef = useRef(null);
    const [prevRoom, setPrevRoom] = useState(null);
    const [connected, setConnected] = useState(false);
    const activeRoomRef = useRef(room);
    const [usernames, setUsernames] = useState({});
    const [userData, setUserData] = useState({});
    const [status, setStatus] = useState("pending");

    useEffect(() => {

        return () => {
            socketRef.current.disconnect();
            setConnected(false);
        };
    }, []);

    useEffect(() => {
        const uniqueUserIds = [...new Set(messages.map(msg => msg.user))];

        uniqueUserIds.forEach(async user => {
            if (!usernames[user]) {
                const response = await fetch(`/get-username?userid=${user}`);
                const data = await response.json();
                console.log(data.username);
                setUsernames(prev => ({ ...prev, [user]: data.username }));
            }
        });
    }, [messages]);


    useEffect(() => {
        const userDataFromCookie = Cookies.get('userData');

        if (userDataFromCookie) {
            const userData = JSON.parse(userDataFromCookie);
            setUserData(userData); // store this in a state variable or context

            setMessages([]);
            if (room) {
                setPrevRoom(room);
            }
            activeRoomRef.current = room; // Update ref to current room

            if (!connected) {
                socketRef.current = io.connect('http://localhost:3001');
                setConnected(true);
            }

            console.log(userData);
            socketRef.current.emit('set-user', userData.github_oauth_id, (acknowledgmentMessage) => {
                if (acknowledgmentMessage === 'User ID received successfully.') {
                    setStatus("acknowledged");
                } else {
                    setStatus("error");
                }
            });

            if (prevRoom != null) {
                socketRef.current.emit('leave-room', prevRoom);
            }

            socketRef.current.emit('join-room', room);
            socketRef.current.emit('request-historical-messages', room);

            socketRef.current.on('historical-messages', (historicalMessages) => {
                // Check if the room associated with the messages matches the currently active room
                if (historicalMessages.length > 0 && historicalMessages[0].room === activeRoomRef.current) {
                    console.log("historical-message");
                    setMessages(historicalMessages);
                }
            });

            socketRef.current.on('receive-message', (message) => {
                console.log("Received message:", message);
                setMessages((prev) => [...prev, message]);
            });


            return () => {
                socketRef.current.off('historical-messages');
                socketRef.current.off('receive-message');
            };
        }

    }, [room]);

    const sendMessage = () => {
        console.log(room + ' : ' + input);
        socketRef.current.emit('send-message', { room, message: input });

        // Use setMessages to update the state
        const newMessage = {
            message: input,
            room,
            timestamp: new Date().toISOString()
        };
        setInput('');
        console.log('Sent Message : ' + newMessage);
    };

    function humanReadableTimestamp(timestamp) {
        const date = new Date(timestamp);
    
        // Create an array of month names for display
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
    
        // Extract the date details
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes();
    
        // Return the formatted string
        return `${monthNames[monthIndex]} ${day}, ${year} ${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
    }
    

    return (
        <div>
            <div>
                {messages.map((messageObj, index) => (
                    messageObj.message ? (
                        <div key={index}>
                            <p>{usernames[messageObj.user] || 'Fetching...'} ({humanReadableTimestamp(messageObj.timestamp)}): {messageObj.message}</p>
                        </div>
                    ) : null
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
