const Player = require('./serverClasses/player');
const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(port, () => {
    console.log('Server running at http://localhost:' + port);
});

let players = {};
let updatedPlayers = {} // Used for sending player positions to players

let updateInterval = setInterval(() => {
    updatedPlayers = {};
    for (let id in players) {
        players[id].move();
        updatedPlayers[id] = {'x': players[id].x, 'y': players[id].y};
    }
    io.emit("updatePlayers", updatedPlayers);
}, 15);

io.on('connection', (socket) => {
    // console.log(players)
    console.log("user con")
    players[socket.id] = new Player("red");

    for (let id in players) {
        socket.emit("newPlayer", {id: id, "color": players[id].color});  // send the new player to all other clients
    }

    socket.broadcast.emit("newPlayer", {id: socket.id, "color": players[socket.id].color});  // send the new player to all other clients

    socket.on('moveClick', (click) => {
        players[socket.id].calcSpeed(click.x, click.y);
    })

    socket.on('disconnect', () => {
        socket.broadcast.emit("playerDisconnect", socket.id)
        delete players[socket.id];
    });
  });

