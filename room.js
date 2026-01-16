const { nanoid } = require("nanoid");

const rooms = {};

function createRoom(hostSocketId) {
  const code = nanoid(6).toUpperCase();

  rooms[code] = {
    code: code,
    host: hostSocketId,
    players: [],
    state: "lobby",
    currentTurnIndex: 0,
    votes: {},
    votedPlayers: new Set(),
    mode: null
  };

  return rooms[code];
}

function joinRoom(code, socketId, name) {
  const room = rooms[code];
  if (!room) return null;


    const alreadyJoined = room.players.find(p => p.id === socketId);
  if (alreadyJoined) {
    return room;
  }
  
  room.players.push({
    id: socketId,
    name,
    alive: true
  });

  return room;
}


function startGame(code, socketId) {
    const room = rooms[code];
    if (!room) return null;
  
    if (room.host !== socketId) return "NOT_HOST";
  
    room.state = "started";
    return room;
  }
  

  function getRoom(code) {
    return rooms[code];
  }


  function setMode(code, mode, socketId) {
    const room = rooms[code];
    if (!room) return null;
    if (room.host !== socketId) return "NOT_HOST";
  
    room.mode = mode;
    return room;
  }

  
  
  module.exports = {
    createRoom,
    joinRoom,
    startGame,
    getRoom,
    setMode
  };
  