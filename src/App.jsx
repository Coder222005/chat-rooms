import  { useState, useEffect } from 'react';
import { socket } from './socket';
import Dashboard from './components/Dashboard';
import ChatRoom from './components/ChatRoom';
import NamePrompt from './components/NamePrompt';



function App() {
  const [userName, setUserName] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(true);

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleNameSubmit = (name) => {
    setUserName(name);
    setShowNamePrompt(false);
  };

  const handleJoinRoom = (roomName) => {
    setCurrentRoom(roomName);
    socket.emit('join-room', { roomName, userName });
  };

  const handleLeaveRoom = () => {
    socket.emit('leave-room', currentRoom);
    setCurrentRoom('');
  };

  if (showNamePrompt) {
    return <NamePrompt onSubmit={handleNameSubmit} />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {currentRoom ? (
        <ChatRoom
          socket={socket}
          roomName={currentRoom}
          userName={userName}
          onLeaveRoom={handleLeaveRoom}
        />
      ) : (
        <Dashboard
          socket={socket}
          userName={userName}
          onJoinRoom={handleJoinRoom}
        />
      )}
    </div>
  );
}

export default App;
 