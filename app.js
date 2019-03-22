const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000
server.listen(port)

// room = {
//   'room id': gameState
// }

const room = {}

const gameState = {
  players: {},
  coins: [],
  isPlaying: false,
}

const canvas = {
  width: 480,
  height: 320
}

let roomList = []

io.on('connection', function(socket) {
  var game = ''
  var state = ''
  console.log(`new user connected`);

  socket.on('disconnect', function() {
    delete gameState.players[socket.id];
    gameState.coins = [];
    console.log('user disconnected');
  });

  socket.on('newPlayer', function() {
    gameState.players[socket.id] = {
      x: Math.random() * 250,
      y: Math.random() * 250,
      width: 25,
      height: 25,
      score: 0
    }
  });

  socket.on('toggleGame', function(roomId) {
    
    gameState.isPlaying = !gameState.isPlaying;
    console.log(gameState.isPlaying);
    if(gameState.isPlaying === true) {
      game = setInterval(() => {
        let circleX = Math.random() * (canvas.width - 50) + 25;
        let circleY = Math.random() * (canvas.height - 50) + 25;
        gameState.coins.push({
          x: circleX,
          y: circleY
        })
      }, 2000);

      state = setInterval(() => {
        io.sockets.emit('state', gameState);
      }, 1000 / 60);
    } else {
      clearInterval(state);
      clearInterval(game);
    }
  });

  socket.on('playerMovement', function(playerMovement) {
    const player = gameState.players[socket.id]
    const canvasWidth = 480
    const canvasHeight = 320
    
    if (playerMovement.left && player.x > 0) {
      player.x -= 4
    }
    if (playerMovement.right && player.x < canvasWidth - player.width) {
      player.x += 4
    }
    if (playerMovement.up && player.y > 0) {
      player.y -= 4
    }
    if (playerMovement.down && player.y < canvasHeight - player.height) {
      player.y += 4
    }
  });

  socket.on('coinState', function(coins) {
    gameState.coins = coins
  })



  // room socket
  socket.emit('fetchRoom', { roomList, id:socket.id })

  socket.on('createRoom', function(roomObj) {
    roomList.unshift(roomObj)
    io.emit('createRoom', roomObj)
  })

  socket.on('enterRoom', function(userObj) {
    socket.join(userObj.roomName)
    roomList[getIndex(userObj.roomName)].users.push(userObj.username)
    socket.emit('enterRoom', {
      currUsers: roomList[getIndex(userObj.roomName)].users,
      roomName: userObj.roomName
    })
    
    socket.broadcast.to(userObj.roomName).emit('newJoin', userObj.username)
  })
});