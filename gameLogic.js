
function assignRoles(players, mode) {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const specialPlayer = shuffled[0];
  
    players.forEach((player) => {
      if (player.id === specialPlayer.id) {
        player.role = mode === "spy" ? "spy" : "infiltrator";
      } else {
        player.role = "normal";
      }
    });
  }


  function eliminatePlayer(room) {
    const votes = room.votes;
    let maxVotes = 0;
    let eliminatedId = null;
  
    for (const playerId in votes) {
      if (votes[playerId] > maxVotes) {
        maxVotes = votes[playerId];
        eliminatedId = playerId;
      }
    }
  
    if (!eliminatedId) return null;
  
    const player = room.players.find(p => p.id === eliminatedId);
    if (player) {
      player.alive = false;
    }
  
    room.votes = {}; // reset votes
    room.currentTurnIndex = 0;
  
    return player;
  }
  


function checkWin(room) {
    const alivePlayers = room.players.filter(p => p.alive);
    const specialAlive = alivePlayers.some(
      p => p.role === "spy" || p.role === "infiltrator"
    );
  
    if (!specialAlive) {
      return { winner: "normal" };
    }
  
    if (alivePlayers.length <= 2 && specialAlive) {
      return { winner: "special" };
    }
  
    return null;
  }


  function startVotingPhase(room, io, onVotingComplete) {
  room.state = "voting";
  room.votes = {};
  room.votedPlayers = new Set();

  const alivePlayers = room.players.filter(p => p.alive);
const totalVoters = alivePlayers.length;
  let votingEnded = false;


  io.to(room.code).emit("votingStarted", {
    players: alivePlayers.map(p => ({
      id: p.id,
      name: p.name
    }))
  });

   const timer = setTimeout(() => {
    if (votingEnded) return;
    votingEnded = true;
    onVotingComplete();
  }, 20000);

    room.finishVotingEarly = () => {
    if (votingEnded) return;
    votingEnded = true;
    clearTimeout(timer);
    onVotingComplete();
  };
}


// function endVoting(room, io) {
//   room.state = "speaking";

//   let maxVotes = 0;
//   let eliminatedId = null;

//   for (const id in room.votes) {
//     if (room.votes[id] > maxVotes) {
//       maxVotes = room.votes[id];
//       eliminatedId = id;
//     }
//   }

//   let eliminatedPlayer = null;

//   if (eliminatedId) {
//     eliminatedPlayer = room.players.find(p => p.id === eliminatedId);
//     if (eliminatedPlayer) {
//       eliminatedPlayer.alive = false;
//     }
//   }

//   io.to(room.code).emit("playerEliminated", eliminatedPlayer);

//   const win = checkWin(room);
//   if (win) {
//     room.state = "ended";
//     io.to(room.code).emit("gameOver", win);
//     return;
//   }

//   // Start next round

// }
function endVoting(room, io) {
  let maxVotes = 0;
  let eliminatedId = null;

  for (const id in room.votes) {
    if (room.votes[id] > maxVotes) {
      maxVotes = room.votes[id];
      eliminatedId = id;
    }
  }

  let eliminatedPlayer = null;

  if (eliminatedId) {
    eliminatedPlayer = room.players.find(p => p.id === eliminatedId);
    if (eliminatedPlayer) {
      eliminatedPlayer.alive = false;
    }
  }

  // reset round data
  room.votes = {};
  room.votedPlayers = new Set();
  room.currentTurnIndex = 0;

  return eliminatedPlayer;
}






  


  module.exports = {
    assignRoles,
    eliminatePlayer,
    checkWin,
    startVotingPhase,
    endVoting
  };