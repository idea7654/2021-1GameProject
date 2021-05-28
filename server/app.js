const express = require("express");
const app = express();
const socket = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");

const server = app.listen(5000);
let players = [];
let rooms = [];

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(bodyParser.json());

app.all("/*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

// app.get("/api/createRoom", (req, res) => {
//   const randomString = Math.random().toString(36).substr(2, 11);
//   rooms.push(randomString);
//   res.send(randomString);
// });

// app.post("/api/enterRoom", (req, res) => {
//   rooms.forEach((i) => {
//     if (i == req.body.InputValue) {
//       res.send({ message: success });
//     }
//   });
// });

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

  socket.on("makeRoom", () => {
    const randomString = Math.random().toString(36).substr(2, 11);
    rooms.push(randomString);
    socket.join(randomString);
    socket.emit("makeRoom", randomString);
  });

  socket.on("enterRoom", (data) => {
    let flag = false;
    rooms.forEach((i) => {
      if (i == data) {
        socket.join(i);
        //io.to(i).emit("successRoom");
        flag = true;
      }
    });
    if (flag) {
      io.to(data).emit("successRoom");
    } else {
      socket.emit("inviteError");
    }
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
