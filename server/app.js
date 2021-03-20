const express = require("express");
const app = express();
const socket = require("socket.io");

const server = app.listen(5000);
let players = [];

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.emit("requestPlayerData");
  socket.on("getPlayerData", (data) => {
    players.push(data);
  });
});
