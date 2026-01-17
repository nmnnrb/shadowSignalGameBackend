 function startSpeakingPhase(room, io, onSpeakingComplete) {
  room.state = "speaking";
  room.currentTurnIndex = 0;

  // ✅ ONLY alive players
  const alivePlayers = room.players.filter(p => p.alive);

  function nextTurn() {
    if (room.currentTurnIndex >= alivePlayers.length) {
      onSpeakingComplete();
      return;
    }

    const player = alivePlayers[room.currentTurnIndex];

   io.to(room.code).emit("turnStarted", {
      playerId: player.id,
      name: player.name,
      players: alivePlayers.map(p => ({
        id: p.id,
        name: p.name,
        alive: p.alive
      }))
    });

    setTimeout(() => {
      io.to(room.code).emit("turnEnded", {
        playerId: player.id
      });

      room.currentTurnIndex++;
      nextTurn();
    }, 10000);
  }

  nextTurn();
}


module.exports = { startSpeakingPhase };



// function startSpeakingPhase(room, io) {
//     const alivePlayers = room.players;
//     if (alivePlayers.length === 0) return;
  
//     const currentPlayer = alivePlayers[room.currentTurnIndex];
  
//     io.to(room.code).emit("turnStarted", {
//       playerId: currentPlayer.id,
//       name: currentPlayer.name
//     });
  
//     setTimeout(() => {
//       io.to(room.code).emit("turnEnded", {
//         playerId: currentPlayer.id
//       });
  
//       room.currentTurnIndex =
//         (room.currentTurnIndex + 1) % alivePlayers.length;
  
//       startSpeakingPhase(room, io);
//     }, 30000);
//   }
  
  // module.exports = { startSpeakingPhase };
  