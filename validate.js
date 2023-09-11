function LobbyData(roomName, password) {
    if (typeof roomName !== 'string' || roomName.length < 3 || roomName.length > 50) {
        return false;
    }
    if (typeof password !== 'string' || password.length > 20) {
        return false;
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
