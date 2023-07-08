// const Player = require('./public/Classes/player');
const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { setInterval } = require('timers/promises');
const io = new Server(server);

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(port, () => {
    console.log('Server running at http://localhost:' + port);
});

players = [];

setInterval(() => {
    console.log(players);
    players.forEach(player => {
        player.move();
        // io.emit("player", player)
    });
}, 15);

io.on('connection', (socket) => {
    // console.log(players)
    console.log("user con")
    players[socket.id] = new Player("red");

    players.forEach(player => { // send all players to the new player
        console.log(player);
        // socket.emit("newPlayer", {id: socket.id, color: players[socket.id].color"})
    });

    socket.broadcast.emit("newPlayer", {id: socket.id, "color": players[socket.id].color});  // send the new player to all other clients

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
  });









class Player{
    constructor(color){
        this.y = 200
        this.x = 200; // b = y - ax
        this.health = 100;
        this.color = color
        this.speedTotal = 1;
        this.speedX = 5;
        this.speedY = 5;
        this.targetPosX = undefined;
        this.targetPosY = undefined;
        this.knockbackX = 0;
        this.knockbackY = 0;
    }

    calcSpeed(mouseX, mouseY) {
        this.targetPosX = mouseX;
        this.targetPosY = mouseY;
        let xDiff = mouseX - this.x;
        let yDiff = mouseY - this.y;

        let hyp = Math.hypot(xDiff, yDiff)

        this.speedX = xDiff / hyp * this.speedTotal
        this.speedY = yDiff / hyp * this.speedTotal
    }

    move() {
        if (this.x < this.targetPosX + Math.abs(this.speedX) && this.x > this.targetPosX - Math.abs(this.speedX)) {
            this.speedX = 0;
            this.speedY = 0;
        }
        this.x += this.speedX;
        this.y += this.speedY;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, 2 * Math.PI);
        ctx.fill();
    }
}