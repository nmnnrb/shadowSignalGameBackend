const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createRoom , joinRoom, startGame, getRoom, setMode } = require("./room");
const { assignRoles , eliminatePlayer, startVotingPhase,
  endVoting,
  checkWin } = require("./gameLogic");
const { getWords } = require("./ai");
// const { startSpeakingPhase } = require("./speaking");
const { startSpeakingPhase} = require("./speaking");



const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req, res) => {
  res.send("Shadow Signal server is running");
});

function runGameLoop(room, io) {
  startSpeakingPhase(room, io, () => {
startVotingPhase(room, io, () => {
      const eliminatedPlayer = endVoting(room, io);
      io.to(room.code).emit("playerEliminated", eliminatedPlayer);

      console.log(
  "🧪 Backend alive players:",
  room.players.filter(p => p.alive).map(p => p.name)
);



    // ✅ THIS LINE FIXES ROUND 2 ISSUE
      io.to(room.code).emit("roomUpdated", {
        players: room.players.filter(p => p.alive)
      });
      const win = checkWin(room);
       if (win) {
        room.state = "ended";
        io.to(room.code).emit("gameOver", win);
        return; // 🛑 STOP GAME LOOP
      }
       console.log("🔁 Starting next round...");
      setTimeout(() => {
        runGameLoop(room, io);
      }, 2000); // small pause for UX
    });
  });
}



io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("createRoom", () => {
    const room = createRoom(socket.id);
    socket.emit("roomCreated", room);
  });


  // joinRoom JoinROom JoinRoom JoinROOOM-------x----x-x--x-x-----x-

  socket.on("joinRoom", ({ code, name }) => {
    const room = joinRoom(code, socket.id, name);
  
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }
  
    socket.join(code);
  
    io.to(code).emit("roomUpdated", room);
  });



  // start Game -----x--------x-------x------x-
  socket.on("startGame", ({ code }) => {
    const result = startGame(code, socket.id);
   const room = getRoom(code);
   if(!room) return;
    if (result === "NOT_HOST") {
      socket.emit("error", "Only host can start the game");
      return;
    }
  
    if (!result) {
      socket.emit("error", "Room not found");
      return;
    }
    const mode = result.mode || "spy";
    assignRoles(result.players, mode);
    
    const words = getWords(mode);

 result.players.forEach(player => {
  if (player.role === "normal") {
    player.word = words.normal;
  } else {
    player.word = words.special;
  }
});

// socket.on("enterGame", ({ code }) => {
//   const room = getRoom(code);
//   if (!room) return;

//   const player = room.players.find(p => p.id === socket.id);
//   if (!player) return;

//   // 🔐 send role
//   socket.emit("yourRole", player.role);

//   // 🔐 send word
//   socket.emit("yourWord", player.word ?? null);
// });




  
// Send room without roles
const safeRoom = {
  ...result,
  players: result.players.map(p => ({
    id: p.id,
    name: p.name
  }))
};

io.to(code).emit("gameStarted", safeRoom);

// Send private roles
result.players.forEach(player => {
  io.to(player.id).emit("yourRole", player.role);
});



setTimeout(() => {
  runGameLoop(result, io);
}, 1000);

// ------x--------x--
  });

  

  // ----x-----xx-------xx------


  socket.on("requestWord", ({ code }) => {
  const room = getRoom(code);
  if (!room) return;

  const player = room.players.find(p => p.id === socket.id);
  if (!player) return;

  socket.emit("yourWord", player.word);
});


// ------++++-----x+==x=x=x--x-x--x--x-x-x-x--x 

socket.on("requestRole", ({ code }) => {
  const room = getRoom(code);
  if (!room) return;

  const player = room.players.find(p => p.id === socket.id);
  if (!player) return;

  socket.emit("yourRole", player.role);
});


  socket.on("vote", ({ code, targetId }) => {
  const room = getRoom(code);
  if (!room || room.state !== "voting") return;

  // Prevent double voting
  if (room.votedPlayers.has(socket.id)) return;

  room.votedPlayers.add(socket.id);
  room.votes[targetId] = (room.votes[targetId] || 0) + 1;

  io.to(code).emit("voteUpdate", {
    votes: room.votes,
    votedCount: room.votedPlayers.size
  });

  const aliveCount = room.players.filter(p => p.alive).length;

  // Everyone voted → end early
  if (room.votedPlayers.size === aliveCount) {
    if (room.finishVotingEarly) {
      room.finishVotingEarly();
    }
  }
});


  

  //----//xx---x-x--x-x-x--xx---


  socket.on("endVoting", ({ code }) => {
    const room = getRoom(code);
    if (!room) return;
  
    const eliminated = eliminatePlayer(room);
  
    io.to(code).emit("playerEliminated", eliminated);

    const winResult = checkWin(room);
    if (winResult) {
      io.to(code).emit("gameOver", winResult);
    }
    
  });


  //----x----xx---x--xxxx---
  socket.on("setMode", ({ code, mode }) => {
    const result = setMode(code, mode, socket.id);
  
    if (result === "NOT_HOST") {
      socket.emit("error", "Only host can set mode");
      return;
    }
  
    if (!result) {
      socket.emit("error", "Room not found");
      return;
    }
  
    io.to(code).emit("modeUpdated", result.mode);
  });

  
  


  ///-----x--xxx---xxxx---x----xxx--x--x-x-x-
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});





server.listen(4000, () => {
  console.log("🚀 Server running on port http://localhost:4000");
});

