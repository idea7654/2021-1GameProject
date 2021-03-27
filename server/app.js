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
  // socket.emit("requestPlayerData");
  // socket.on("getPlayerData", async (data) => {
  //   await players.push(data);
  //   await socket.emit("sendPlayersData", players);
  // });

  socket.on("playerMove", (data) => {
    io.emit("playerMove", data);
  });

  socket.on("sendPlayerData", async (data) => {
    await players.push({ ...data, id: socket.id });
    await io.emit("getOtherPlayer", {
      players: players,
      socketId: socket.id,
    });
  });

  socket.on("disconnect", () => {
    players.forEach((element) => {
      if (element.id === socket.id) {
        const index = players.indexOf(element);
        players.splice(index, 1);
      }
    });
  });
});
