require("dotenv").config(); // Load environment variables
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Load environment variables
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Set up WebSocket server with Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity; restrict in production
    methods: ["GET", "POST"],
  },
});

// Store connected clients
let connectedPeers = {};

// WebSocket connection event
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle peer offer (SDP) from a client
  socket.on("offer", (data) => {
    const { to, from, offer } = data;
    if (connectedPeers[to]) {
      io.to(to).emit("offer", { from, offer });
    }
  });

  // Handle peer answer (SDP)
  socket.on("answer", (data) => {
    const { to, from, answer } = data;
    if (connectedPeers[to]) {
      io.to(to).emit("answer", { from, answer });
    }
  });

  // Handle ICE candidate exchange
  socket.on("ice-candidate", (data) => {
    const { to, from, candidate } = data;
    if (connectedPeers[to]) {
      io.to(to).emit("ice-candidate", { from, candidate });
    }
  });

  // Handle user joining a room (identifies peers)
  socket.on("register", (peerId) => {
    connectedPeers[peerId] = socket.id;
    console.log(`Peer registered: ${peerId}`);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    for (const peerId in connectedPeers) {
      if (connectedPeers[peerId] === socket.id) {
        delete connectedPeers[peerId];
      }
    }
  });
});

// HTTP route to check server health
app.get("/", (req, res) => {
  res.send("WebRTC Signaling Server is running!");
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
