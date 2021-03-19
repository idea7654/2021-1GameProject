const express = require("express");
const app = express();
const socket = require("socket.io");

const server = app.listen(5000);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("hello", (data) => {
    console.log(data);
  });
});
