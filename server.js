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

const game = {};

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
    io.to(game[id].gameID).emit("role-update", { gameUpdate: game[id] });
  });

  socket.on("submit-total", ({ total, cliID, gameID }) => {
    let reset = false;
    if (game[gameID][cliID] !== "spectator") {
      game[gameID][game[gameID][cliID]] = total;
      console.log(game[gameID].p1);
    }

    if (game[gameID].p1 && game[gameID].p2) {
      if (game[gameID].p1 === game[gameID].p2) {
        game[gameID].p1 = null;
        game[gameID].p2 = null;
        reset = true;
      }
      if (game[gameID].p1 < game[gameID].p2) {
        game[gameID].position = game[gameID].position - 1;
        game[gameID].p1 = null;
        game[gameID].p2 = null;
        reset = true;
      }
      if (game[gameID].p1 > game[gameID].p2) {
        game[gameID].position = game[gameID].position + 1;
        game[gameID].p1 = null;
        game[gameID].p2 = null;
        reset = true;
      }
    }
    console.log(game[gameID]);
    io.in(`${gameID}`).emit("roll-update", {
      gameUpdate: game[gameID],
      resetting: reset,
    });
  });
});
