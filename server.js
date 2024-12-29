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

const connections = []; // Store connected users who are sharing their internet

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle share-internet event
  socket.on("share-internet", (data) => {
    console.log(`Received 'share-internet' event from ${socket.id}`);
    console.log("Data received:", data);

    const existingConnection = connections.find(
      (conn) => conn.id === socket.id
    );
    if (existingConnection) {
      // If already sharing, update the existing connection
      console.log(`Updating connection for user ${socket.id}`);
      existingConnection.location = data.location;
      existingConnection.speed = data.speed;
      existingConnection.uptime = data.uptime;
      existingConnection.connectionId = data.connectionId;
    } else {
      // Otherwise, add a new connection
      console.log(`Adding new connection for user ${socket.id}`);
      connections.push({
        id: socket.id,
        location: data.location,
        speed: data.speed,
        uptime: data.uptime,
        connectionId: data.connectionId,
      });
    }

    // Emit the updated list of available connections to all clients
    console.log("Emitting updated connections list:", connections);
    io.emit("update-users", connections);
  });

  // Handle stop-sharing event
  socket.on("stop-sharing", () => {
    console.log(`Received 'stop-sharing' event from ${socket.id}`);
    const index = connections.findIndex((conn) => conn.id === socket.id);
    if (index !== -1) {
      console.log(`Removing connection for user ${socket.id}`);
      connections.splice(index, 1);
      io.emit("update-users", connections); // Emit updated list
      console.log("Emitting updated connections list:", connections);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    const index = connections.findIndex((conn) => conn.id === socket.id);
    if (index !== -1) {
      console.log(`Removing connection for user ${socket.id}`);
      connections.splice(index, 1);
      io.emit("update-users", connections); // Emit updated list
      console.log("Emitting updated connections list:", connections);
    }
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
