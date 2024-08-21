

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", socket.id);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", socket.id);
    });

    socket.on("send-signal", (payload) => {
      io.to(payload.userToSignal).emit("receive-signal", {
        signal: payload.signal,
        callerID: payload.callerID,
      });
    });

    socket.on("return-signal", (payload) => {
      io.to(payload.callerID).emit("signal-returned", {
        signal: payload.signal,
        id: socket.id,
      });
    });
  });
});

server.listen(3001, () => {
  console.log("Server running on port 5000");
});
