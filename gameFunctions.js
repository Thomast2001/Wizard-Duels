function checkPlayerOutsideArena(player) {
    if (player.x < 270 || player.x > 1520 || player.y < 130 || player.y > 710) {
        return true;
    }
}

function radomizePlayerPositions(players, playerIDs) {
    playerIDs.forEach(id => {
        players[id].x = (Math.random() * 1250) + 270;
        players[id].y = (Math.random() * 580) + 130;
    });
}

function resetPlayers(io, room, players, playerIDs) {
    radomizePlayerPositions(players, playerIDs);

    let updatedPlayers = {};
    playerIDs.forEach(id => {
        updatedPlayers[id] = {'x': players[id].x, 'y': players[id].y, 'health': players[id].health};
        players[id].health = 100;
        players[id].speedX = 0;
        players[id].speedY = 0;
        players[id].knockbackX = 0;
        players[id].knockbackY = 0;
    });
    io.to(room.name).emit("updatePlayers", updatedPlayers);
}


module.exports = { checkPlayerOutsideArena, resetPlayers }
