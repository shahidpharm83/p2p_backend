const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity
  },
});

let users = []; // Store connected users

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle "share-internet" event to add users
  socket.on("share-internet", (userDetails) => {
    userDetails.id = socket.id; // Add unique socket ID to the user
    users.push(userDetails); // Add user to the list
    io.emit("update-users", users); // Broadcast the updated list
    console.log("Updated Users:", users);
  });

  // Handle connection requests
  socket.on("connect-to-peer", (peerId) => {
    const peer = users.find((user) => user.id === peerId);
    if (peer) {
      // Notify both peers of the connection
      io.to(peerId).emit("peer-connected", { peerId: socket.id });
      socket.emit("peer-connected", { peerId: peerId });
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    users = users.filter((user) => user.id !== socket.id); // Remove the user
    io.emit("update-users", users); // Broadcast the updated list
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
