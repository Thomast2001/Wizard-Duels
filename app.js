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
const upgrades = require('./public/upgrades.json');

const port = 3000

const colors = ['red', 'green', 'blue', 'cyan', 'black', 'pink', 'purple'];

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(port, () => {
    console.log('Server running at http://localhost:' + port);
});


io.on('connection', (socket) => {
    console.log("user con")
    players[socket.id] = new Player('red', `player${Math.floor(Math.random()*10)}`);
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
        if (rooms[roomIndex] && currentRoom == null && !rooms[roomIndex].gameStarted) { // Check if room exists and player is not already in room 
            rooms[roomIndex].playerIDs.push(socket.id);
            currentRoom = roomJoined;
            socket.join(roomJoined);
            players[socket.id].color = rooms[roomIndex].freeColors.shift();

            players[socket.id].name = joined.playerName;
            rooms[roomIndex].playerIDs.forEach(id => {  // Send all the existing players to the new player
                socket.emit("newPlayer", {'id': id, 'color': players[id].color, 'name': players[id].name}); 
            })

            socket.to(currentRoom).emit("newPlayer", {'id': socket.id, 'color': players[socket.id].color, 'name': players[socket.id].name});  // send the new player to all other clients
        } else {
            socket.emit('error', 'Game already started or does not exist');
        }
    })

    socket.on("createRoom", room => {
        if (!validate.LobbyData(rooms, room.roomName)){ // Validate the room data
            socket.emit('error', 'Error: Lobby name already exists');
            return;
        }
        console.log(room.playerName)
        console.log(players[socket.id].name)

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
            console.log(room.freeColors);
            room.freeColors.push(players[socket.id].color);
            const newColor = room.freeColors.shift();
            console.log(room.freeColors);
            players[socket.id].color = newColor;
            io.in(currentRoom).emit("color", {playerID: socket.id, color: newColor})
            console.log(newColor);
        }
    })

    socket.on("leaveLobby", () => {
        if (currentRoom != null) {
            let roomIndex = findRoomIndex(rooms, currentRoom);
            roomFunctions.playerLeaveLobby(io, rooms, currentRoom, roomIndex, players, socket.id, fireballs);
            socket.to(currentRoom).emit("playerDisconnect", socket.id);
            currentRoom = null;
            players[socket.id].gold = 250;
            players[socket.id].levels = {Fireball: 1, Airwave: 0, Teleport: 0, Lightning: 0, Health: 0, Boots: 0};
        }
    })

    socket.on("shop" , (purchased) => {
        console.log(purchased)
        console.log(players[socket.id].gold);
        console.log(upgrades[purchased].cost);
        const currentLevel = players[socket.id].levels[purchased];
        if (currentRoom != null && players[socket.id].gold >= upgrades[purchased].cost[currentLevel]) {
            if (purchased == 'Health') {
                players[socket.id].maxHealth += 20;
            } else if (purchased == 'Boots') {
                players[socket.id].speedTotal += 0.25;
            }
            players[socket.id].gold -= upgrades[purchased].cost[currentLevel];
            players[socket.id].levels[purchased] += 1;
            socket.emit("updateGold", players[socket.id].gold);
            io.in(currentRoom).emit("upgradePurchased", ({'playerID': socket.id, 'purchased': purchased})); // Send the upgrade to all clients
        }
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
        if (players[socket.id].health > 0 && !players[socket.id].stunned 
                        && !players[socket.id].onCooldown['fireball'] && players[socket.id].levels.Fireball > 0) {
            const fireballLevel = players[socket.id].levels.Fireball;
            fireballs[currentRoom].push(new A.Fireball(players[socket.id].x, players[socket.id].y, 
                        targetPos.x, targetPos.y, socket.id, upgrades.Fireball.speed[fireballLevel], upgrades.Fireball.damage[fireballLevel]));

            socket.to(currentRoom).emit('fireball', {'x': players[socket.id].x, 'y': players[socket.id].y,
                            'targetPosX': targetPos.x, 'targetPosY': targetPos.y, 'playerID': socket.id})
            players[socket.id].cooldown('fireball', 950);
        }
    })
    
    socket.on('airwave', () => {
        if (players[socket.id].health > 0 && !players[socket.id].stunned 
                        && !players[socket.id].onCooldown['airwave'] && players[socket.id].levels.Airwave > 0) {
            io.to(currentRoom).emit('airwave', socket.id);
            const airwaveLevel = players[socket.id].levels.Airwave;
            const pushMultiplier = upgrades.Airwave.pushMultiplier[airwaveLevel]
            const cooldown = upgrades.Airwave.cooldown[airwaveLevel] * 1000;
            A.airwave(players, socket.id, rooms[findRoomIndex(rooms, currentRoom)].playerIDs, pushMultiplier);
            players[socket.id].cooldown('airwave', cooldown - 50);
        }
    }) 

    socket.on('teleport', pos => {
        if (players[socket.id].health > 0 && !players[socket.id].stunned 
                        && !players[socket.id].onCooldown['teleport'] && players[socket.id].levels.Teleport > 0) {
            players[socket.id].calcSpeed(pos.x, pos.y);
            A.teleport(players[socket.id], pos, upgrades);
            socket.to(currentRoom).emit('teleport', {'playerID': socket.id, 'pos': pos})
            players[socket.id].cooldown('teleport', 7450);
        }
    })

    socket.on('lightning', (lightning) => {
        if (players[socket.id].health > 0 && !players[socket.id].stunned 
                && !players[socket.id].onCooldown['lightning'] && players[socket.id].levels.Lightning > 0) {
            const lightningLevel = players[socket.id].levels.Lightning;
            const cooldown = upgrades.Lightning.cooldown[lightningLevel] * 1000;
            if (lightning.playerHit) {
                players[lightning.playerHit].health -= upgrades.Lightning.damage[lightningLevel];
                players[lightning.playerHit].stun(1500, players, lightning.playerHit); // Stun the player hit
            }
            socket.to(currentRoom).emit('lightning', lightning)
            players[socket.id].cooldown('lightning', cooldown - 50);
        }
    });

  // socket.on('dead', () => {
  //     console.log("dead");
  // })

    socket.on('disconnect', () => {
        console.log(socket.id)
        socket.to(currentRoom).emit("playerDisconnect", socket.id)
        delete players[socket.id];

        if (currentRoom != null){
            let roomIndex = findRoomIndex(rooms, currentRoom);
            roomFunctions.playerLeaveLobby(io, rooms, currentRoom, roomIndex, players, socket.id, fireballs);
           // let roomIndex = findRoomIndex(rooms, currentRoom);
           // let IDindex = rooms[roomIndex].playerIDs.indexOf(socket.id); 
           // rooms[roomIndex].playerIDs.splice(IDindex, 1); // Remove playerID from the room
           // roomFunctions.unreadyAllPlayers(io, rooms[roomIndex], players);
//
           // if (rooms[roomIndex].playerIDs.length === 0) { // if the room is empty after disconnect the room is removed
           //     rooms.splice(roomIndex, 1);
           //     delete fireballs[currentRoom];
           // }
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
                const winner = roomFunctions.getWinner(players, room);
                io.in(room.name).emit("endGame", (winner));
                room.gamePlaying = false;
                roomFunctions.unreadyAllPlayers(io, room, players);
                roomFunctions.updateGold(io, players, winner, room.playerIDs);
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