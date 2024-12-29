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

// Store connected users
const connections = [];

// Handle new connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle 'share-internet' event
  socket.on("share-internet", (data) => {
    console.log(`Received 'share-internet' from ${socket.id}`);

    const existingConnection = connections.find(
      (conn) => conn.id === socket.id
    );
    if (existingConnection) {
      // Update existing connection details
      console.log(`Updating connection for user ${socket.id}`);
      existingConnection.location = data.location;
      existingConnection.speed = data.speed;
      existingConnection.uptime = data.uptime;
      existingConnection.connectionId = data.connectionId;
    } else {
      // Add new connection
      console.log(`Adding new connection for user ${socket.id}`);
      connections.push({
        id: socket.id,
        location: data.location,
        speed: data.speed,
        uptime: data.uptime,
        connectionId: data.connectionId,
      });
    }

    // Emit updated connections list
    io.emit("update-users", connections);
  });

  // Handle 'stop-sharing' event
  socket.on("stop-sharing", () => {
    console.log(`Received 'stop-sharing' from ${socket.id}`);

    // Find and remove the connection for this user
    const index = connections.findIndex((conn) => conn.id === socket.id);
    if (index !== -1) {
      console.log(`Removing connection for user ${socket.id}`);
      connections.splice(index, 1);
      io.emit("update-users", connections); // Emit updated connections list
    }
  });

  // Handle 'get-users' event for requesting available users
  socket.on("get-users", () => {
    console.log(`Received 'get-users' request from ${socket.id}`);
    socket.emit("update-users", connections); // Emit the list of current available connections
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove connection data for disconnected user
    const index = connections.findIndex((conn) => conn.id === socket.id);
    if (index !== -1) {
      console.log(`Removing connection for user ${socket.id}`);
      connections.splice(index, 1);
      io.emit("update-users", connections); // Emit updated connections list
    }
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
