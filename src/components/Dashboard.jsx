import  { useState, useEffect } from 'react';
import { Plus, Users, MessageCircle } from 'lucide-react';

function Dashboard({ socket, userName, onJoinRoom }) {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    socket.emit('get-rooms');
    
    socket.on('rooms-list', (roomsList) => {
      setRooms(roomsList);
    });

    const interval = setInterval(() => {
      socket.emit('get-rooms');
    }, 3000);

    return () => {
      clearInterval(interval);
      socket.off('rooms-list');
    };
  }, [socket]);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      socket.emit('create-room', newRoomName.trim());
      setNewRoomName('');
      setShowCreateForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Anonymous Chat Rooms</h1>
          <p className="text-gray-300">Welcome, {userName}! Join a room or create your own.</p>
        </header>

        <div className="mb-6 flex justify-center">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Room
            </button>
          ) : (
            <form onSubmit={handleCreateRoom} className="flex gap-2">
              <input
                type="text"
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
                maxLength={30}
                required
              />
              <button
                type="submit"
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewRoomName('');
                }}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.name}
              className="bg-gray-800 rounded-lg shadow-lg p-6 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-blue-400" />
                  {room.name}
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {room.userCount} users
                </span>
                <button
                  onClick={() => onJoinRoom(room.name)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No active rooms yet. Be the first to create one!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
 