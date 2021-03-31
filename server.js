const cors = require("cors");
const app = require("express")();
const http = require("http").createServer(app);
const { v4: uuidv4 } = require("uuid");

const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

http.listen(8080);

const clients = {};
let game = {};
let position = 3;

console.log("running");

app.get("/", (req, res) => {
  console.log("fuck you");
});

io.on("connection", (socket) => {
  console.log("connected");

  socket.on("create-game", () => {
    const gameID = uuidv4();
    const cliID = uuidv4();
    game[gameID] = {
      gameID: gameID,
      position: 3,
      p1: null,
      p2: null,
      clients: [cliID],
      [cliID]: "spectator",
    };
    socket.join(gameID);
    socket.emit("created-game", {
      newGame: game[gameID],
      cliID: cliID,
    });
  });

  socket.on("join-game", (gameID) => {
    socket.join(gameID);
    const cliID = uuidv4();
    const ourGame = game[gameID];
    game[gameID].cliID = "spectator";

    game[gameID].clients.push(cliID);

    socket.emit("joining-game", {
      joinGame: game[gameID],
    });
  });

  socket.on("set-role", ({ id, myID, role }) => {
    game[id][myID] = role;
    console.log(game[id]);
    io.to(game[id].gameID).emit("update-game", game[id]);
  });

  socket.on("submit-total", ({ total, cliID, gameID }) => {
    if (game[gameID][cliID] !== "spectator") {
      game[gameID][game[gameID][cliID]] = total;
    }

    if (game[gameID].p1 && game[gameID].p2) {
      if (game[gameID].p1 === game[gameID].p2) {
        game[gameID].p1 = null;
        game[gameID].p2 = null;
      }
      if (game[gameID].p1 < game[gameID].p2) {
        game[gameID].position = game[gameID].position - 1;
        game[gameID].p1 = null;
        game[gameID].p2 = null;
      }
      if (game[gameID].p1 > game[gameID].p2) {
        game[gameID].position = game[gameID].position + 1;
        game[gameID].p1 = null;
        game[gameID].p2 = null;
      }
      console.log(game[gameID]);
      io.in(`${gameID}`).emit("update-game", game[gameID]);
    }
    // game[role] = total;
    // if (game["p1"] && game["p2"]) {
    //   if (game["p1"] === game["p2"]) {
    //     return (game = {});
    //   }
    //   game["p1"] > game["p2"]
    //     ? (position = position - 1)
    //     : (position = position + 1);
    //   console.log(position);

    //   socket.emit("update-position", position);
    //   game = {};
    // }
  });
});
