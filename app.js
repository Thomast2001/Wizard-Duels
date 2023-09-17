const Player = require('./serverClasses/player');
const A = require('./serverClasses/abilities');
const validate = require('./validate.js');
const roomFunctions = require('./roomFunctions.js');
const gameFunctions = require('./gameFunctions.js');
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

    socket.on("joinRoom", joined => {
        let roomJoined = joined.room
        let roomIndex = findRoomIndex(rooms, roomJoined) // Find the index of the room in the "rooms" array
        if (currentRoom == null && !rooms[roomIndex].gameStarted) { // if player is not already in a room
            rooms[roomIndex].playerIDs.push(socket.id);
            currentRoom = roomJoined;
            socket.join(roomJoined);

            players[socket.id].name = joined.playerName;
            rooms[roomIndex].playerIDs.forEach(id => {  // Send all the existing players to the new player
                socket.emit("newPlayer", {'id': id, 'color': players[id].color, 'name': players[id].name}); 
            })

            socket.to(currentRoom).emit("newPlayer", {'id': socket.id, 'color': players[socket.id].color, 'name': players[socket.id].name});  // send the new player to all other clients
        }
    })

    socket.on("createRoom", room => {
        if (!validate.LobbyData(room.roomName, room.password)){ // Validate the room data
            socket.emit('error', 'Invalid lobby data');
            return;
        }

        if (!validate.PlayerName(room.playerName)){  // Validate the player name
            socket.emit('error', 'Player name does not meet the requirements');
            return;
        }

        players[socket.id].name = room.playerName;
        rooms.push({ name: room.roomName, playerIDs: [socket.id], gameStarted: false, gamePlaying: false, password: room.password }); // Create the room
        fireballs[room.roomName] = [] // Create array for fireballs

        socket.join(room.roomName); // Player joins the new room/lobby
        currentRoom = room.roomName;
        socket.emit("newPlayer", {'id': socket.id, 'color': players[socket.id].color, 'name': players[socket.id].name}); 
    })

    socket.on("ready", () => {
        let room = rooms[findRoomIndex(rooms, currentRoom)];
        if (!room.gamePlaying) {
            players[socket.id].ready = true;
            io.in(currentRoom).emit("ready", socket.id);
            if (roomFunctions.allPlayersReady(players, room.playerIDs)){
                gameFunctions.resetPlayers(io, currentRoom, players, room.playerIDs)
                room.gamePlaying = true;
                room.gameStarted = true;
                io.in(currentRoom).emit("startGame"); // Start the game if all players are ready
            }
        }
    })

    socket.on("unready", () => {
        let room = rooms[findRoomIndex(rooms, currentRoom)];
        if (!room.gamePlaying) {
            players[socket.id].ready = false;
            io.in(currentRoom).emit("unready", socket.id);
        }
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
        if (players[socket.id].health > 0 && !players[socket.id].stunned 
                        && !players[socket.id].onCooldown['fireball']) {
            fireballs[currentRoom].push(new A.Fireball(players[socket.id].x, players[socket.id].y, targetPos.x, targetPos.y, socket.id));
            socket.to(currentRoom).emit('fireball', {'x': players[socket.id].x, 'y': players[socket.id].y,
                            'targetPosX': targetPos.x, 'targetPosY': targetPos.y, 'playerID': socket.id})
            players[socket.id].cooldown('fireball', 950);
        }
    })
    
    socket.on('airwave', () => {
        if (players[socket.id].health > 0 && !players[socket.id].stunned 
                        && !players[socket.id].onCooldown['airwave']) {
            io.to(currentRoom).emit('airwave', socket.id);
            A.airwave(players, socket.id, rooms[findRoomIndex(rooms, currentRoom)].playerIDs, fireballs);
            players[socket.id].cooldown('airwave', 9950);
        }
    }) 

    socket.on('teleport', pos => {
        if (players[socket.id].health > 0 && !players[socket.id].stunned 
                        && !players[socket.id].onCooldown['teleport']) {
            players[socket.id].calcSpeed(pos.x, pos.y);
            A.teleport(players[socket.id], pos);
            socket.to(currentRoom).emit('teleport', {'playerID': socket.id, 'pos': pos})
            players[socket.id].cooldown('teleport', 7450);
        }
    })

    socket.on('lightning', (lightning) => {
        if (players[socket.id].health > 0 && !players[socket.id].stunned 
                        && !players[socket.id].onCooldown['lightning']) {
            if (lightning.playerHit) {
                players[lightning.playerHit].health -= 1;
                players[lightning.playerHit].stun(1500, players, lightning.playerHit); // Stun the player hit
            } 
            socket.to(currentRoom).emit('lightning', lightning)
            players[socket.id].cooldown('lightning', 14950);
        }
    });

  // socket.on('dead', () => {
  //     console.log("dead");
  // })

    socket.on('disconnect', () => {
        socket.to(currentRoom).emit("playerDisconnect", socket.id)
        delete players[socket.id];

        if (currentRoom != null){
            let roomIndex = findRoomIndex(rooms, currentRoom);
            let IDindex = rooms[roomIndex].playerIDs.indexOf(socket.id); 
            rooms[roomIndex].playerIDs.splice(IDindex, 1); // Remove playerID from the room
            roomFunctions.unreadyAllPlayers(io, rooms[roomIndex], players);

            if (rooms[roomIndex].playerIDs.length === 0) { // if the room is empty after disconnect the room is removed
                rooms.splice(roomIndex, 1);
                delete fireballs[currentRoom];
            }
        }
        

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
        if (room.gamePlaying) {
            if (roomFunctions.allPlayersDead(players, room)) {// If only 1 player is alive, end the game
                io.in(room.name).emit("endGame");
                room.gamePlaying = false;
                roomFunctions.unreadyAllPlayers(io, room, players);
            }
            updatedPlayers = {};
            room.playerIDs.forEach(id => {
                players[id].move();
                updatedPlayers[id] = {'x': players[id].x, 'y': players[id].y, 'health': players[id].health};
            });
            io.to(room.name).emit("updatePlayers", updatedPlayers);
            
            fireballs[room.name].forEach((fireball, index) => {
                fireball.move();
                fireball.collisionCheck(index, fireballs, players, room)
            })
        }
    });

}, 15);

let lavaDamageInterval = setInterval(() => {
    rooms.forEach(room => {
        if (room.gamePlaying) {
            room.playerIDs.forEach(id => {
                if (gameFunctions.checkPlayerOutsideArena(players[id])){
                    players[id].health--;
                }
            });
        }
    });
}, 100);

app.get('/rooms', (req, res) => { 
    res.json(rooms);
});