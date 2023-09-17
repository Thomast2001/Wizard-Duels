function allPlayersReady(players, playerIDs){
    for (let i = 0; i < playerIDs.length; i++) { // Check if all players are ready
        console.log(players[playerIDs[i]].ready)
        if (!players[playerIDs[i]].ready) return false;
    }
    return true;
}

function allPlayersDead(players, room){
    let alive = 0;
    room['playerIDs'].forEach(id => {
        console.log("talt")
        if (players[id].health > 0) {
            alive++;
        }
    });
    if (alive <= 1) {
        console.log("jeps");
        return true
    } else {
        return false
    }
}

function unreadyAllPlayers(io, room, players) {
    room['playerIDs'].forEach(id => {
        players[id].ready = false;
        io.in(room.name).emit("unready", id);
    });
}

module.exports = { allPlayersReady, allPlayersDead, unreadyAllPlayers}
