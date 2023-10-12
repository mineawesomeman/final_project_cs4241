import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Cookies from 'js-cookie';

function Chat({ room }) {
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const socketRef = useRef(null);
    const activeRoomRef = useRef(room);
    const [usernames, setUsernames] = useState({});
    const [userData, setUserData] = useState({});
    const [status, setStatus] = useState('pending');

    // Clean up when unmounting
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        const uniqueUserIds = [...new Set(messages.map(msg => msg.user))];

        const fetchUsernames = async () => {
            for (const user of uniqueUserIds) {
                if (!usernames[user]) {
                    try {
                        if (user) { // Check if user is defined
                            const response = await fetch(`/get-username?userid=${user}`);
                            const data = await response.json();
                            setUsernames(prev => ({ ...prev, [user]: data.username }));
                        }
                    } catch (error) {
                        console.error('Error fetching username:', error);
                    }
                }
            }
        };

        fetchUsernames();
    }, [messages, usernames]);

    const loadHistoricalMessages = async () => {
        try {
            console.log(`front end loading historical messages for room: ${room}`);
            const response = await fetch(`/get-historical-messages?room=${room}`);
            if (!response.ok) {
                console.error('Server returned an error:', response.statusText);
                setMessages([]); // Reset to an empty array on error
                return [];
            }
            const historicalMessages = await response.json();
            console.log('Historical messages loaded:', historicalMessages);

            if (Array.isArray(historicalMessages) && historicalMessages.length > 0) {
                setMessages(historicalMessages);
                return historicalMessages;
            } else {
                console.warn('No historical messages found for the room.');
                setMessages([]);
                return [];
            }
        } catch (error) {
            console.error('Error fetching historical messages:', error);
            setMessages([]); // Reset to an empty array on error
            return [];
        }
    };

    //useEffect(() => {
    //    if (!connected) {
    //        socketRef.current = io.connect('http://localhost:3001');
    //        setConnected(true);
    //    }

    //    (async () => {
    //        if (connected) {
    //            // Join the room
    //            socketRef.current.emit('join-room', room);

    // Load historical messages for the current room
    //               const historicalMessages = await loadHistoricalMessages();
    //             console.log('hist messages:', historicalMessages);
    //
    //              // Append historical messages to the state
    //            setMessages(prevMessages => [...prevMessages, ...historicalMessages]);
    //
    //               // Log all messages to the console after they have been loaded
    //              console.log('All messages:', messages);
    //      }
    //    })();
    //}, [connected, room]);


    useEffect(() => {
        const userDataFromCookie = Cookies.get('userData');

        if (userDataFromCookie) {
            const userData = JSON.parse(userDataFromCookie);
            setUserData(userData);

            const fetchData = async () => {
                // Replace this logic with what you want to do when the room changes
                if (room !== activeRoomRef.current) {
                    setMessages([]);
                    socketRef.current.emit('leave-room', activeRoomRef.current);
                    socketRef.current.emit('join-room', room);
                    // Call loadHistoricalMessages when room changes
                    loadHistoricalMessages();
                    activeRoomRef.current = room;
                }

                if (!socketRef.current || !connected) {
                    socketRef.current = io.connect('http://localhost:3001');
                    setConnected(true);
                }

                socketRef.current.emit('set-user', userData.github_oauth_id, (acknowledgmentMessage) => {
                    setStatus(acknowledgmentMessage === 'User ID received successfully' ? 'acknowledged' : 'error');
                });

                socketRef.current.on('receive-message', (message) => {
                    setMessages(prevMessages => {
                        // Check if message with the same ID already exists
                        if (prevMessages.some(msg => msg.message_id === message.message_id)) {
                            return prevMessages;
                        }
                        const updatedMessages = [...prevMessages, message];
                        console.log('recieved new All messages:', updatedMessages); // Log all messages to the console
                        return updatedMessages;
                    });
                });


            };

            fetchData();
        }
        loadHistoricalMessages();
    }, [room]);



    const sendMessage = () => {
        const newMessage = {
            user: userData.github_oauth_id,
            message: input,
            room,
            timestamp: new Date().toISOString(),
        };

        // Clear the input
        setInput('');

        // Emit the new message
        socketRef.current.emit('send-message', { room, message: input });

        // Add the new message to the state, thus it gets rendered immediately
        //setMessages(prevMessages => [...prevMessages, newMessage]);
    };

    function humanReadableTimestamp(timestamp) {
        const date = new Date(timestamp);
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes();

        return `${monthNames[monthIndex]} ${day}, ${year} ${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
    }

    return (
        <div>
            <div>
                {(() => {
                    //console.log("printing : ", messages);

                    return messages.map((messageObj, index) => {
                        try {
                            if (messageObj.message_content) {
                                return (
                                    <div key={index}>
                                        <p>
                                            {usernames[messageObj.user_id] || 'Fetching...'} ({humanReadableTimestamp(messageObj.timestamp)}): {messageObj.message_content}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        } catch (error) {
                            console.error(`Error rendering message at index ${index}:`, error);
                            return <p key={index}>Error rendering message at index {index}</p>;
                        }
                    });
                })()}
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

