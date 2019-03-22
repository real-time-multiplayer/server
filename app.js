const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000
server.listen(port)

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
    for(let i = 0; i < roomList.length; i++) {
      if(roomList[i].gameState.players.hasOwnProperty(socket.id)) {
        delete roomList[i].gameState.players[socket.id];
        if(isEmpty(roomList[i].gameState.players)) {
          roomList.splice(i, 1);
          io.emit('fetchRoom', { roomList })
        }
      }
    }
    console.log('user disconnected');
    clearInterval(state);
    clearInterval(game);
  });

  // socket.on('newPlayer', function() {
  //   gameState.players[socket.id] = {
  //     x: Math.random() * 250,
  //     y: Math.random() * 250,
  //     width: 25,
  //     height: 25,
  //     score: 0,
  //     name: socket.id
  //   }
  // });

  socket.on('toggleGame', function(roomName) {
    roomList[getIndex(roomName)].gameState.isPlaying = !roomList[getIndex(roomName)].gameState.isPlaying
    if(roomList[getIndex(roomName)].gameState.isPlaying === true) {
      game = setInterval(() => {
        let circleX = Math.random() * (canvas.width - 50) + 25;
        let circleY = Math.random() * (canvas.height - 50) + 25;
        if(roomList[getIndex(roomName)].gameState.coins.length < 20) {
          roomList[getIndex(roomName)].gameState.coins.push({
            x: circleX,
            y: circleY
          })
        }
      }, 1000);

      state = setInterval(() => {
        io.to(roomName).emit('state', roomList[getIndex(roomName)].gameState);
      }, 1000 / 60);
    } else {
      clearInterval(state);
      clearInterval(game);
    }
  });

  socket.on('playerMovement', function({ playerMovement, roomName }) {
    if(getIndex(roomName) > -1) {
      for(let player in roomList[getIndex(roomName)].gameState.players) {
        if(roomList[getIndex(roomName)].gameState.players[player].score > 20 * roomList[getIndex(roomName)].users.length) {
          clearInterval(state);
          clearInterval(game);
        }
      }
      const player = roomList[getIndex(roomName)].gameState.players[socket.id]
      
      if (playerMovement.left && player.x > 0) {
        player.x -= 4
      }
      if (playerMovement.right && player.x < canvas.width - player.width) {
        player.x += 4
      }
      if (playerMovement.up && player.y > 0) {
        player.y -= 4
      }
      if (playerMovement.down && player.y < canvas.height - player.height) {
        player.y += 4
      }
    }
  });

  socket.on('coinState', function({ coins, roomName, id}) {
    roomList[getIndex(roomName)].gameState.coins = coins;
    roomList[getIndex(roomName)].gameState.players[id].score++;
  })



  // room socket
  socket.emit('fetchRoom', { roomList });

  socket.on('createRoom', function(roomObj) {
    roomList.unshift(roomObj)
    io.emit('createRoom', roomObj)
  })

  socket.on('enterRoom', function(userObj) {
    if(getIndex(userObj.roomName) > -1) {
      socket.join(userObj.roomName);
      roomList[getIndex(userObj.roomName)].gameState.players[socket.id] = {
        x: Math.random() * 250,
        y: Math.random() * 250,
        width: 25,
        height: 25,
        score: 0,
        name: userObj.username
      };

      roomList[getIndex(userObj.roomName)].users.push(userObj.username);
      socket.emit('enterRoom', {
        currUsers: roomList[getIndex(userObj.roomName)].users,
        roomName: userObj.roomName
      })
      
      socket.broadcast.to(userObj.roomName).emit('newJoin', userObj.username)
    }
  })
});

function getIndex(roomName) {
  return roomList.findIndex(room => room.roomName === roomName)
}

function isEmpty(obj) {
  for(let key in obj) {
    if(obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}