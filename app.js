const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000
server.listen(port)

const gameState = {
  players: {},
  coins: [],
  isPlaying: true,
}

const canvas = {
  width: 480,
  height: 320
}

io.on('connection', function(socket) {
  setInterval(() => {
    io.sockets.emit('state', gameState);
  }, 1000 / 60);

  if(gameState.isPlaying) {
    setInterval(() => {
      let circleX = Math.random() * (canvas.width - 20) + 10;
      let circleY = Math.random() * (canvas.height - 20) + 10;
      gameState.coins.push({
        x: circleX,
        y: circleY
      })
    }, 2000);
  }

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
    }
  });

  socket.on('gameStart', function() {

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
});