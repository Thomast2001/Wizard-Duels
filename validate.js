function LobbyData(rooms, roomName, password) {
    if (typeof roomName !== 'string' || roomName.length < 3 || roomName.length > 15) {
        return false;
    }
    if (typeof password !== 'string' || password.length > 15) {
        return false;
    }

    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].name == roomName) {
            return false;
        }
    }
    return true;
}


function PlayerName(playerName) {
    if (typeof playerName !== 'string' || playerName.length < 3 || playerName.length > 13) {
        return false;
    }
    return true;
}


module.exports = { LobbyData, PlayerName }
