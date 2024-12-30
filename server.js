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

const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer({});
app.use((req, res) => {
  proxy.web(req, res, { target: "https://www.google.com" }); // Replace with any destination
});

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
      console.log(
        `New Connection ID: ${data.connectionId} with speed: ${data.speed} from ${data.location.longitude} and ${data.location.latitude}`
      );
    }

    // Emit updated connections list
    io.emit("update-users", connections);
    console.log(
      `Connection details: ${connections.location}, ${connections.speed}, ${connections.uptime}, ${connections.connectionId}`
    );
  });
  socket.on("share-internet", (data) => {
    console.log("Received share-internet event with data:", data);

    // Update or create connection based on received data
    const existingConnection = connections.find(
      (conn) => conn.id === socket.id
    );
    if (existingConnection) {
      console.log(`Updating connection for user ${socket.id}`);
      existingConnection.location = data.location;
      existingConnection.speed = data.speed;
      existingConnection.uptime = data.uptime;
      existingConnection.connectionId = data.connectionId;
    } else {
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

  // Handle 'connect-to-peer' event
  socket.on("connect-to-peer", (peerId) => {
    console.log(`Received 'connect-to-peer' request with peerId: ${peerId}`);

    // Validate peerId (add your custom validation logic)
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

// Start the server

