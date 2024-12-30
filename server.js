const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const httpProxy = require("http-proxy");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity
  },
});

// Store connected users
const connections = [];

// Create the proxy server
const proxy = httpProxy.createProxyServer({});

// Use proxy to forward all requests to a dynamic target
app.use((req, res) => {
  const targetUrl = req.headers["target-url"]; // Expect target URL to be passed in headers

  // Check if a valid target URL was provided
  if (targetUrl && targetUrl.startsWith("http")) {
    console.log(`Proxying request to: ${targetUrl}`);
    proxy.web(req, res, { target: targetUrl }); // Forward the request to the target URL
  } else {
    res.status(400).send("Missing or invalid target URL in headers.");
  }
});

// Handle new socket connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle 'share-internet' event
  socket.on("share-internet", (data) => {
    console.log("Received 'share-internet' event with data:", data);

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

    // Emit updated connections list to all connected clients
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

  // Handle 'get-users' event to request available users
  socket.on("get-users", () => {
    console.log(`Received 'get-users' request from ${socket.id}`);
    socket.emit("update-users", connections); // Emit the list of current available connections
  });

  // Handle 'connect-to-peer' event to initiate connection with a peer
  socket.on("connect-to-peer", (peerId) => {
    console.log(`Received 'connect-to-peer' request with peerId: ${peerId}`);

    // Validate peerId (you can add custom validation logic here)
    if (peerId && peerId !== "") {
      console.log(`Connecting to peer: ${peerId}`);

      // Emit a successful connection response back to the client
      socket.emit("peer-connected", { peerId: peerId });
    } else {
      // Emit an error event if peerId is invalid
      socket.emit("connect-error", "Invalid peer ID");
    }
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

// Start the server on port 3000
server.listen(3000, () => {
  console.log("Server running on port 3000");
});
