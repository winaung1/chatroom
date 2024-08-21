const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('join-room', ({ roomId, name }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', socket.id);

    socket.on('send-signal', (payload) => {
      io.to(payload.userToSignal).emit('receive-signal', {
        signal: payload.signal,
        callerID: payload.callerID,
      });
    });

    socket.on('return-signal', (payload) => {
      io.to(payload.callerID).emit('signal-returned', {
        signal: payload.signal,
        id: socket.id,
      });
    });

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', socket.id);
      console.log('User disconnected:', socket.id);
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
