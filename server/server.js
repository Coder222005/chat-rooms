import  express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const MONGODB_URI = 'mongodb+srv://Cluster09533:clNWRkNRS2tN@cluster09533.fjm3rgq.mongodb.net/?retryWrites=true&w=majority';
let db;

MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db();
  })
  .catch(error => console.log('MongoDB connection error:', error));

const activeRooms = new Map();
const userRooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('get-rooms', async () => {
    try {
      const rooms = await db.collection('rooms').find({}).toArray();
      const roomsWithUserCount = rooms.map(room => ({
        name: room.name,
        userCount: activeRooms.get(room.name)?.size || 0
      }));
      socket.emit('rooms-list', roomsWithUserCount);
    } catch (error) {
      console.log('Error fetching rooms:', error);
    }
  });

  socket.on('create-room', async (roomName) => {
    try {
      const existingRoom = await db.collection('rooms').findOne({ name: roomName });
      if (!existingRoom) {
        await db.collection('rooms').insertOne({
          name: roomName,
          createdAt: new Date()
        });
        activeRooms.set(roomName, new Set());
      }
      io.emit('room-created', roomName);
    } catch (error) {
      console.log('Error creating room:', error);
    }
  });

  socket.on('join-room', async ({ roomName, userName }) => {
    try {
      socket.join(roomName);
      
      if (!activeRooms.has(roomName)) {
        activeRooms.set(roomName, new Set());
      }
      activeRooms.get(roomName).add({ socketId: socket.id, userName });
      userRooms.set(socket.id, { roomName, userName });

      const users = Array.from(activeRooms.get(roomName)).map(user => user.userName);
      io.to(roomName).emit('room-users', users);

      const joinMessage = {
        type: 'system',
        text: `${userName} joined the room`,
        timestamp: new Date()
      };
      
      socket.to(roomName).emit('user-joined', joinMessage);
      
      await db.collection('messages').insertOne({
        ...joinMessage,
        roomName
      });

    } catch (error) {
      console.log('Error joining room:', error);
    }
  });

  socket.on('send-message', async ({ roomName, message, userName }) => {
    try {
      const messageData = {
        userName,
        text: message,
        timestamp: new Date(),
        type: 'user'
      };

      io.to(roomName).emit('message', messageData);
      
      await db.collection('messages').insertOne({
        ...messageData,
        roomName
      });

    } catch (error) {
      console.log('Error sending message:', error);
    }
  });

  socket.on('leave-room', (roomName) => {
    handleUserLeave(socket, roomName);
  });

  socket.on('disconnect', () => {
    const userRoom = userRooms.get(socket.id);
    if (userRoom) {
      handleUserLeave(socket, userRoom.roomName);
    }
    console.log('User disconnected:', socket.id);
  });

  const handleUserLeave = async (socket, roomName) => {
    try {
      const userRoom = userRooms.get(socket.id);
      if (!userRoom) return;

      const { userName } = userRoom;
      
      socket.leave(roomName);
      
      if (activeRooms.has(roomName)) {
        const roomUsers = activeRooms.get(roomName);
        roomUsers.forEach(user => {
          if (user.socketId === socket.id) {
            roomUsers.delete(user);
          }
        });
        
        if (roomUsers.size === 0) {
          activeRooms.delete(roomName);
        }
      }
      
      userRooms.delete(socket.id);

      const users = activeRooms.has(roomName) 
        ? Array.from(activeRooms.get(roomName)).map(user => user.userName)
        : [];
      io.to(roomName).emit('room-users', users);

      const leaveMessage = {
        type: 'system',
        text: `${userName} left the room`,
        timestamp: new Date()
      };
      
      socket.to(roomName).emit('user-left', leaveMessage);
      
      await db.collection('messages').insertOne({
        ...leaveMessage,
        roomName
      });

    } catch (error) {
      console.log('Error handling user leave:', error);
    }
  };
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
 