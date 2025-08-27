import  { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Users } from 'lucide-react';

function ChatRoom({ socket, roomName, userName, onLeaveRoom }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('room-users', (roomUsers) => {
      setUsers(roomUsers);
    });

    socket.on('user-joined', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('user-left', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('message');
      socket.off('room-users');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.emit('send-message', {
        roomName,
        message: newMessage.trim(),
        userName
      });
      setNewMessage('');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <header className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onLeaveRoom}
              className="mr-4 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-white">{roomName}</h1>
          </div>
          <div className="flex items-center text-gray-400">
            <Users className="w-4 h-4 mr-1" />
            <span>{users.length} users online</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'system' ? 'justify-center' : ''}`}>
                {msg.type === 'system' ? (
                  <div className="text-gray-500 text-sm italic">
                    {msg.text}
                  </div>
                ) : (
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.userName === userName
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-gray-700 text-white'
                  }`}>
                    {msg.userName !== userName && (
                      <div className="text-xs text-gray-300 mb-1">{msg.userName}</div>
                    )}
                    <div>{msg.text}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                maxLength={500}
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Online Users</h3>
          <div className="space-y-2">
            {users.map((user, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm ${
                  user === userName ? 'bg-blue-600 text-white' : 'text-gray-300'
                }`}
              >
                {user} {user === userName && '(You)'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;
 