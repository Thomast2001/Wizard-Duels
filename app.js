const Player = require('./serverClasses/player');
const A = require('./serverClasses/abilities');
const validate = require('./validate.js');
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
    let currentRoom = null;

        /////////////////////////////////
        // Player is not in a game yet //
        /////////////////////////////////

    socket.on("joinRoom", msg => {
        if (currentRoom == null) { // if player is not already in a room
            let roomJoined = msg.room
            let roomIndex = findRoomIndex(rooms, roomJoined) // Find the index of the room in the "rooms" array

            rooms[roomIndex].playerIDs.push(socket.id);
            currentRoom = roomJoined;
            socket.join(roomJoined);

            players[socket.id].name = msg.playerName;
            rooms[roomIndex].playerIDs.forEach(id => {  // Send all the existing players to the new player
                socket.emit("newPlayer", {'id': id, 'color': players[id].color, 'name': players[id].name}); 
            })

            socket.to(currentRoom).emit("newPlayer", {'id': socket.id, 'color': players[socket.id].color, 'name': players[socket.id].name});  // send the new player to all other clients
        }
    })

    socket.on("createRoom", room => {
        if (!validate.LobbyData(room.roomName, room.password)){ // Validate the room data
            socket.emit('error', 'Invalid lobby data');
        }

        if (!validate.PlayerName(room.playerName)){  // Validate the player name
            socket.emit('error', 'Player name does not meet the requirements');
        }

        players[socket.id].name = room.playerName;
        rooms.push({ name: room.roomName, playerIDs: [socket.id], gameStarted: false, password: room.password }); // Create the room
        fireballs[room.roomName] = [] // Create array for fireballs

        socket.join(room.roomName); // Player joins the new room/lobby
        currentRoom = room.roomName;
        socket.emit("newPlayer", {'id': socket.id, 'color': players[socket.id].color, 'name': players[socket.id].name}); 
    })


        /////////////////////////////////
        // Player is in a started game //
        /////////////////////////////////

    socket.on('moveClick', (click) => {
        if (players[socket.id].health > 0 && !players[socket.id].stunned) {
            players[socket.id].calcSpeed(click.x, click.y);
            socket.to(currentRoom).emit("move", {'id': socket.id, x: click.x, y: click.y});
        }
    })

    socket.on('fireball', targetPos => {
        if (players[socket.id].health > 0 && !players[socket.id].stunned) {
            fireballs[currentRoom].push(new A.Fireball(players[socket.id].x, players[socket.id].y, targetPos.x, targetPos.y, socket.id));
            socket.to(currentRoom).emit('fireball', {'x': players[socket.id].x, 'y': players[socket.id].y,
                            'targetPosX': targetPos.x, 'targetPosY': targetPos.y, 'playerID': socket.id})
        }
    })

    socket.on('teleport', pos => {
        if (players[socket.id].health > 0 && !players[socket.id].stunned) {
            players[socket.id].calcSpeed(pos.x, pos.y);
            A.teleport(players[socket.id], pos);
            socket.to(currentRoom).emit('teleport', {'playerID': socket.id, 'pos': pos})
        }
    })

    socket.on('airwave', () => {
        if (players[socket.id].health > 0 && !players[socket.id].stunned) {
            io.to(currentRoom).emit('airwave', socket.id);
            A.airwave(players, socket.id, rooms[findRoomIndex(rooms, currentRoom)].playerIDs, fireballs);
        }
    }) 

    socket.on('lightning', (lightning) => {
        if (players[socket.id].health > 0 && !players[socket.id].stunned) {
            if (lightning.playerHit) {
                players[lightning.playerHit].health -= 1;
                players[lightning.playerHit].stun(5000, players, lightning.playerHit); // Stun the player hit
            } 
            socket.to(currentRoom).emit('lightning', lightning)
        }
    });

    socket.on('disconnect', () => {
        socket.to(currentRoom).emit("playerDisconnect", socket.id)
        delete players[socket.id];

        let roomIndex = findRoomIndex(rooms, currentRoom);
        if (currentRoom != null){
            let IDindex = rooms[roomIndex].playerIDs.indexOf(socket.id); 
            rooms[roomIndex].playerIDs.splice(IDindex, 1); // Remove playerID from the room
            console.log(rooms[roomIndex].playerIDs);
        }
        
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
//let rooms = [{ name: "room1", playerIDs: [], gameStarted: false }, { name: "room2", playerIDs: [], gameStarted: false }];
let rooms = [];
let fireballs = {room1: [], room2: []};


let updateInterval = setInterval(() => {
    rooms.forEach(room => {
        updatedPlayers = {};
        room.playerIDs.forEach(id => {
            players[id].move();
            updatedPlayers[id] = {'x': players[id].x, 'y': players[id].y, 'health': players[id].health};
        });
        io.to(room.name).emit("updatePlayers", updatedPlayers);
        
        fireballs[room.name].forEach((fireball, index) => {
            fireball.move();
            fireball.collisionCheck(index, fireballs, players, room);  
        })
    
        io.to(room).emit("updatePlayers", updatedPlayers);
    });

}, 15);

app.get('/rooms', (req, res) => { 
    res.json(rooms);
});