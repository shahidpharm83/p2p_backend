const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const os = require("os");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let connectedUsers = []; // Store connected users

// Function to get local IP address
function getLocalIP() {
  const networkInterfaces = os.networkInterfaces();
  let ipAddress = "Unknown";
  for (const interfaceName in networkInterfaces) {
    networkInterfaces[interfaceName].forEach((network) => {
      if (network.family === "IPv4" && !network.internal) {
        ipAddress = network.address;
      }
    });
  }
  return ipAddress;
}

// Handle user connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register new user
  socket.on("register", (data) => {
    const user = {
      id: socket.id,
      ip: getLocalIP(),
      location: data.location, // Example: {lat: x, lng: y}
      macAddress: data.macAddress,
      speed: data.speed,
      uptime: new Date(),
    };
    connectedUsers.push(user);
    console.log(`User ${socket.id} registered:`, user);

    io.emit("update-users", connectedUsers); // Update all clients with connected users
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    connectedUsers = connectedUsers.filter((user) => user.id !== socket.id);
    console.log("User disconnected:", socket.id);
    io.emit("update-users", connectedUsers); // Update clients after disconnection
  });

  // Handle internet sharing status updates
  socket.on("share-internet", (data) => {
    io.emit("internet-shared", data); // Broadcast sharing status to other clients
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
