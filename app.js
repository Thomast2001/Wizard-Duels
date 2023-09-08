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
    let currentRoom;

    if (Math.random() > 0.5) {
        currentRoom = "room1";
        rooms[0].playerIDs.push(socket.id);
        socket.join("room1");}
    else{
        currentRoom = "room2";
        rooms[1].playerIDs.push(socket.id);
        socket.join("room2");
    }

    rooms[findRoomIndex(rooms, currentRoom)].playerIDs.forEach(id => {  // Send all the existing players to the new player
        socket.emit("newPlayer", {'id': id, 'color': players[id].color, 'name': players[id].name}); 
    })

    socket.to(currentRoom).emit("newPlayer", {'id': socket.id, 'color': players[socket.id].color, 'name': players[socket.id].name});  // send the new player to all other clients

    socket.on('moveClick', (click) => {
        players[socket.id].calcSpeed(click.x, click.y);
        socket.to(currentRoom).emit("move", {'id': socket.id, x: click.x, y: click.y});
    })

    socket.on('fireball', targetPos => {
        fireballs[currentRoom].push(new A.Fireball(players[socket.id].x, players[socket.id].y, targetPos.x, targetPos.y, socket.id));
        socket.to(currentRoom).emit('fireball', {'x': players[socket.id].x, 'y': players[socket.id].y,
                        'targetPosX': targetPos.x, 'targetPosY': targetPos.y, 'playerID': socket.id})
    })

    socket.on('teleport', pos => {
        if (players[socket.id].health > 0) {
            A.teleport(players[socket.id], pos);
            players[socket.id].calcSpeed(pos.x, pos.y);
            socket.to(currentRoom).emit('teleport', {'playerID': socket.id, 'pos': pos})
        }
    })

    socket.on('airwave', () => {
        io.to(currentRoom).emit('airwave', socket.id);
        A.airwave(players, socket.id, rooms[findRoomIndex(rooms, currentRoom)].playerIDs, fireballs);
    })

    socket.on('disconnect', () => {
        socket.to(currentRoom).emit("playerDisconnect", socket.id)
        delete players[socket.id];

        let roomIndex = findRoomIndex(rooms, currentRoom);
        let IDindex = rooms[roomIndex].playerIDs.indexOf(socket.id); 
        rooms[roomIndex].playerIDs.splice(IDindex, 1); // Remove playerID from the room
        console.log(rooms[roomIndex].playerIDs);
        
        //if (rooms[roomIndex].playerIDs.length === 0) { // if the room is empty after disconnect the room is removed
        //    rooms.splice(roomIndex, 1);
        //    delete fireballs[currentRoom];
        //}

    });
  });


function findRoomIndex(rooms, name){
    return rooms.findIndex(room => room.name === name);
}

        ////////////////////////////////////////
        // Handle the game on the server side //
        ////////////////////////////////////////

let players = {};
let updatedPlayers = {} // Used for sending player positions and health to connected clients
let rooms = [{ name: "room1", playerIDs: [] }, { name: "room2", playerIDs: [] }];
let fireballs = {room1: [], room2: []};


let updateInterval = setInterval(() => {
    rooms.forEach(room => {
        updatedPlayers = {};
        room.playerIDs.forEach(id => {
            players[id].move();
            updatedPlayers[id] = {'x': players[id].x, 'y': players[id].y, 'health': players[id].health};
            io.to(room.name).emit("updatePlayers", updatedPlayers);
        });

        fireballs[room.name].forEach((fireball, index) => {
            fireball.move();
            fireball.collisionCheck(index, fireballs, players, room);  
        })
    
        io.to(room).emit("updatePlayers", updatedPlayers);
    });

}, 15);
