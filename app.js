const Player = require('./serverClasses/player');
const AI = require('./serverClasses/AI');
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
const upgrades = require('./public/upgrades.json');

const port = 3000

const colors = ['red', 'green', 'blue', 'cyan', 'black', 'pink', 'purple', 'white'];

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(port, () => {
    console.log('Server running at http://localhost:' + port);
});


io.on('connection', (socket) => {
    players[socket.id] = new Player('red', `player${Math.floor(Math.random()*10)}`, socket.id); // Create a new player object
    let currentRoom = null;

        /////////////////////////////////
        // Player is not in a game yet //
        /////////////////////////////////

    socket.on("joinRoom", joined => {
        if (!validate.PlayerName(joined.playerName)){  // Validate the player name
            socket.emit('error', 'Error: Player name does not meet the requirements');
            return;
        }

        let roomJoined = joined.room
        let roomIndex = findRoomIndex(rooms, roomJoined) // Find the index of the room in the "rooms" array
        if (rooms[roomIndex] && currentRoom == null && !rooms[roomIndex].gameStarted 
                    && rooms[roomIndex].playerIDs.length < 9) { // Check if room exists and player is not already in room 
            rooms[roomIndex].playerIDs.push(socket.id);
            currentRoom = roomJoined;
            socket.join(roomJoined);
            const player = players[socket.id];
            player.color = rooms[roomIndex].freeColors.shift();
            player.name = joined.playerName;
            rooms[roomIndex].playerIDs.forEach(id => {  // Send all the existing players to the new player
                socket.emit("newPlayer", {'id': id, 'color': players[id].color, 'name': players[id].name, 'levels': players[id].levels}); 
            })

            socket.to(currentRoom).emit("newPlayer", {'id': socket.id, 'color': player.color, 'name': player.name, 'levels': players[socket.id].levels});  // send the new player to all other clients
        } else {
            socket.emit('error', 'Error: Room is full or already started');
        }
    })

    socket.on("addAI", (difficulty) => {
        if (currentRoom != null) {
            const id = (Math.random() + 1).toString(36).substring(6) // Generate a random id for the AI
            let roomIndex = findRoomIndex(rooms, currentRoom); // Find the room of the player
            rooms[roomIndex].playerIDs.push(id);
            console.log(currentRoom)
            if (difficulty == 0) { // add normal AI
                players[id] = new AI(rooms[roomIndex].freeColors.shift(), 'AI', id, 0, currentRoom);
            } else { // add unfair AI
                players[id] = new AI(rooms[roomIndex].freeColors.shift(), 'Dawg', id, 1, currentRoom);
            }
            io.to(currentRoom).emit("newPlayer", {'id': id, 'color': players[id].color, 'name': players[id].name});  // send the new player to all other clients
            io.to(currentRoom).emit("ready", id);
            players[id].makePurchases(io, players, id, rooms[roomIndex].playerIDs);
            players[id].ready = true;
        }
    })

    socket.on("createRoom", room => {
        if (!validate.LobbyData(rooms, room.roomName)){ // Validate the room data
            socket.emit('error', 'Error: Lobby name already exists');
            return;
        }

        if (!validate.PlayerName(room.playerName)){  // Validate the player name
            socket.emit('error', 'Error: Player name does not meet the requirements');
            return;
        }

        players[socket.id].name = room.playerName;
        rooms.push({ name: room.roomName, playerIDs: [socket.id], gameStarted: false, gamePlaying: false, 
            freeColors: colors.slice() }); // Create the room
        fireballs[room.roomName] = []; // Create array for fireballs
            
        socket.join(room.roomName); // Player joins the new room/lobby
        currentRoom = room.roomName;
        
        const createdRoom = rooms[findRoomIndex(rooms, currentRoom)];
        players[socket.id].color = createdRoom.freeColors.shift();
        socket.emit("newPlayer", { 'id': socket.id, 'color': players[socket.id].color, 'name': players[socket.id].name }); 
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

    socket.on("color", () => {
        const room = rooms[findRoomIndex(rooms, currentRoom)];
        if (currentRoom && !room.gamePlaying) {
            room.freeColors.push(players[socket.id].color);
            const newColor = room.freeColors.shift();
            players[socket.id].color = newColor;
            io.in(currentRoom).emit("color", {playerID: socket.id, color: newColor})
        }
    })

    socket.on("leaveLobby", () => {
        if (currentRoom != null && rooms[findRoomIndex(rooms, currentRoom)]) {
            let roomIndex = findRoomIndex(rooms, currentRoom);
            rooms[roomIndex].freeColors.push(players[socket.id].color);
            roomFunctions.playerLeaveLobby(io, rooms, currentRoom, roomIndex, players, socket.id, fireballs);
            socket.to(currentRoom).emit("playerDisconnect", socket.id);
            currentRoom = null;
            // reset the player
            players[socket.id].gold = 250;
            players[socket.id].levels = {Fireball: 1, Airwave: 0, Teleport: 0, Lightning: 0, Health: 0, Boots: 0};
            players[socket.id].speedTotal = 2
            players[socket.id].maxHealth = 100
        }
    })

    socket.on("shop" , (purchased) => {
        roomFunctions.purchase(io, players[socket.id], socket.id, upgrades, purchased, currentRoom);
        socket.emit("updateGold", players[socket.id].gold);
    });

        /////////////////////////////////
        // Player is in a started game //
        /////////////////////////////////

    socket.on('moveClick', (click) => {
        if (players[socket.id].health > 0 && !players[socket.id].stunned) {
            players[socket.id].calcSpeed(click.x, click.y);
            socket.to(currentRoom).emit("move", {'id': socket.id, 'x': click.x, 'y': click.y});
        }
    })

    socket.on('fireball', targetPos => {
        gameFunctions.fireball(players[socket.id], socket.id, socket, currentRoom, targetPos, fireballs, upgrades);
    })
    
    socket.on('airwave', () => {
        playerIDs = rooms[findRoomIndex(rooms, currentRoom)].playerIDs;
        gameFunctions.airwave(socket.id, io, currentRoom, players, upgrades, playerIDs);
    }) 

    socket.on('teleport', pos => {
        gameFunctions.teleport(players[socket.id], socket.id, socket, currentRoom, pos, upgrades);
    })

    socket.on('lightning', (lightning) => {
        gameFunctions.lightning(players[socket.id], socket, currentRoom, players, upgrades, lightning);
    });


    socket.on('disconnect', () => {
        socket.to(currentRoom).emit("playerDisconnect", socket.id)
        if (currentRoom != null){
            let roomIndex = findRoomIndex(rooms, currentRoom);
            rooms[roomIndex]?.freeColors.push(players[socket.id].color);
            roomFunctions.playerLeaveLobby(io, rooms, currentRoom, roomIndex, players, socket.id, fireballs);
        }
        delete players[socket.id];
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
let rooms = [];
let fireballs = {};


let updateInterval = setInterval(() => {
    rooms.forEach(room => {
        if (room.gamePlaying) {
            if (roomFunctions.allPlayersDead(players, room)) { // If only 1 player is alive, end the game
                const winner = roomFunctions.getWinner(players, room);
                players[winner].wins++;
                if (players[winner].wins >= 5) {
                    io.in(room.name).emit("gameOver", (players[winner].name));
                    rooms.splice(findRoomIndex(rooms, room.name), 1);
                } else {
                    roomFunctions.endRound(io, players, winner, room)
                }
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


let lavaDamageAndAiInterval = setInterval(() => {
    rooms.forEach(room => {
        if (room.gamePlaying) {
            room.playerIDs.forEach(id => {
                const player = players[id];
                if (gameFunctions.checkPlayerOutsideArena(player)){
                    player.health--;
                }
                if (player.isAI == true && player.health > 0) {
                    player.tick(io, players, fireballs, room.playerIDs);
                }
            });
        }
    });
}, 100);

app.get('/rooms', (req, res) => { 
    res.json(rooms);
});