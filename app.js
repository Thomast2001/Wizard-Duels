const Player = require('./serverClasses/player');
const A = require('./serverClasses/abilities');
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


io.on('connection', (socket) => {
    console.log("user con")
    players[socket.id] = new Player(`hsl(${Math.random()*360},100%, 50%)`, `player${Math.floor(Math.random()*10)}`);

    for (let id in players) {
        socket.emit("newPlayer", {'id': id, 'color': players[id].color, 'name': players[id].name});  // Send all the existing players to the new player
    }

    socket.broadcast.emit("newPlayer", {'id': socket.id, 'color': players[socket.id].color, 'name': players[socket.id].name});  // send the new player to all other clients

    socket.on('moveClick', (click) => {
        players[socket.id].calcSpeed(click.x, click.y);
        socket.broadcast.emit("move", {'id': socket.id, x: click.x, y: click.y});
    })

    socket.on('fireball', targetPos => {
        // players[socket.id].health--;
        // for (let id in players){
        //     A.teleport(players[id], {x: 400, y:400});
        // }
        //players[socket.id].speedX = 0;
        //players[socket.id].speedY = 0;
        fireballs.push(new A.Fireball(players[socket.id].x, players[socket.id].y, targetPos.x, targetPos.y, socket.id));
        socket.broadcast.emit('fireball', {'x': players[socket.id].x, 'y': players[socket.id].y,
                        'targetPosX': targetPos.x, 'targetPosY': targetPos.y, 'playerID': socket.id})
    })

    socket.on('teleport', pos => {
        if (players[socket.id].health > 0) {
            A.teleport(players[socket.id], pos);
            players[socket.id].calcSpeed(pos.x, pos.y);
            socket.broadcast.emit('teleport', {'playerID': socket.id, 'pos': pos})
        }
    })

    socket.on('airwave', () => {
        io.emit('airwave', socket.id);
        A.airwave(players, socket.id, fireballs);
    })

    socket.on('disconnect', () => {
        socket.broadcast.emit("playerDisconnect", socket.id)
        delete players[socket.id];
    });
  });


        ////////////////////////////////////////
        // Handle the game on the server side //
        ////////////////////////////////////////

let players = {};
let updatedPlayers = {} // Used for sending player positions and health to connected clients
let fireballs = [];

let updateInterval = setInterval(() => {
    updatedPlayers = {};
    for (let id in players) {
        players[id].move();
        updatedPlayers[id] = {'x': players[id].x, 'y': players[id].y, 'health': players[id].health};
    }
    fireballs.forEach((fireball, index) => {
        fireball.move();
        fireball.collisionCheck(index, fireballs, players);  
    })
    io.emit("updatePlayers", updatedPlayers);
}, 15);
