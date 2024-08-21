
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {};

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on("join-room", ({ roomId, name }) => {
    socket.join(roomId);
    users[socket.id] = { roomId, name };

    socket.to(roomId).emit("user-connected", { id: socket.id, name });

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

    socket.on("disconnect", () => {
      const { roomId, name } = users[socket.id];
      delete users[socket.id];
      socket.to(roomId).emit("user-disconnected", { id: socket.id, name });
    });
  });
});

server.listen(3001, () => {
  console.log("Server running on port 5000");
});
