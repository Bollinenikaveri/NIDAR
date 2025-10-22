// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();

// Serve static files (broadcaster.html, etc.)
app.use(express.static(path.join(__dirname)));

// Serve a dummy favicon to prevent browser CSP warnings
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'favicon.ico'));
});

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io for signaling
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Viewer joined
  socket.on("viewer-joined", () => {
    socket.broadcast.emit("viewer-joined");
  });

  // Broadcaster offers
  socket.on("offer", (data) => socket.broadcast.emit("offer", data));

  // Viewer answers
  socket.on("answer", (data) => socket.broadcast.emit("answer", data));

  // ICE candidates from both sides
  socket.on("ice-candidate", (data) => socket.broadcast.emit("ice-candidate", data));

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
const PORT = 5000;
server.listen(PORT, () => console.log(`WebRTC signaling server running on port ${PORT}`));
