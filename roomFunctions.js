function allPlayersReady(players, playerIDs){
    for (let i = 0; i < playerIDs.length; i++) { // Check if all players are ready
        if (!players[playerIDs[i]].ready) return false;
    }
    return true;
}

function allPlayersDead(players, room){
    let alive = 0;
    room['playerIDs'].forEach(id => {
        if (players[id].health > 0) {
            alive++;
        }
    });
    if (alive <= 1) {
        return true
    } else {
        return false
    }
}

function unreadyAllPlayers(io, room, players) {
    room['playerIDs'].forEach(id => {
        players[id].ready = false;
    });
    io.in(room.name).emit("unreadyAll");
}

function playerLeaveLobby(io, rooms, currentRoom, roomIndex, players, playerID, fireballs) {
    let playerIndex = rooms[roomIndex].playerIDs.indexOf(playerID); 
    rooms[roomIndex].playerIDs.splice(playerIndex, 1); // Remove playerID from the room

    if (rooms[roomIndex].playerIDs.length === 0) { // if the room is empty after disconnect the room is removed
        rooms.splice(roomIndex, 1);
        delete fireballs[currentRoom];
    } else if (!currentRoom.gamePlaying) {
        unreadyAllPlayers(io, rooms[roomIndex], players);
    }
}

function getWinner(players, room) {
    let winner = null
    room['playerIDs'].forEach(id => {
        console.log(players[id].health);
        if (players[id].health > 0) {
            winner = id;
        }
    });
    return winner;
}

function updateGold(io, players, winner, playerIDs){
    playerIDs.forEach(id => {
        if (id == winner) {
            players[id].gold += 400;
        } else {
            players[id].gold += 300;
        }
        io.to(id).emit("updateGold", players[id].gold);
    });
}

function endRound(io, players, winner, room) {
    io.in(room.name).emit("endGame", (winner));
    room.gamePlaying = false;
    unreadyAllPlayers(io, room, players);
    updateGold(io, players, winner, room.playerIDs);
}

module.exports = { allPlayersReady, allPlayersDead, unreadyAllPlayers, playerLeaveLobby, getWinner, endRound }
