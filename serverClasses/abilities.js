class Fireball{
    constructor(posX, posY, mouseX, mouseY, playerID, speed, damage, id){
        this.x = posX;
        this.y = posY;
        this.speed = calcSpeed(posX, posY, mouseX, mouseY, speed);
        this.damage = damage;
        this.playerID = playerID;
        this.id = id;
    }

    move() {
        this.x += this.speed.x;
        this.y += this.speed.y;
    }

    collisionCheck(io, index, fireballs, players, room) {
        if (this.x < 0 || this.x > 1800 || this.y < 0 || this.y > 900) {
                fireballs[room.name].splice(index,1);
                return;
        }
        let IDs = room.playerIDs;
        for (let i = 0; i < IDs.length; i++) {
            if (this.playerID != IDs[i] && players[IDs[i]].health > 0 &&
                    this.x > players[IDs[i]].x - 21 && this.x < players[IDs[i]].x + 21 &&
                    this.y > players[IDs[i]].y - 25 && this.y < players[IDs[i]].y + 25) {
                players[IDs[i]].knockback(this.speed.x * 2, this.speed.y * 2);
                players[IDs[i]].health -= this.damage;
                fireballs[room.name].splice(index, 1);
                io.in(room.name).emit("fireballExplode", this.id);
                return;
            }
        } 
    }
}
    
function calcSpeed(posX, posY, mouseX, mouseY, totalSpeed) {
    let xDiff = mouseX - posX;
    let yDiff = mouseY - posY;

    let hyp = Math.hypot(xDiff, yDiff)

    let speedX = xDiff / hyp * totalSpeed
    let speedY = yDiff / hyp * totalSpeed
    return {'x': speedX, 'y': speedY};
}

function teleport(player, pos, upgrades){
    let teleportPos = {'x': pos.x, 'y': pos.y}
    let maxTeleportDist = upgrades.Teleport.range[player.levels.Teleport];
    let xDiff = teleportPos.x - player.x;
    let yDiff = teleportPos.y - player.y;
    let distance = Math.hypot(xDiff, yDiff);
    if (distance > maxTeleportDist) {
        teleportPos.x = player.x + xDiff * (maxTeleportDist/distance);
        teleportPos.y = player.y + yDiff * (maxTeleportDist/distance);
    }
    player.x = teleportPos.x;
    player.y = teleportPos.y;
}

function airwave(players, casterID, playerIDs, multiplier){
    playerIDs.forEach(playerID => {
        if (playerID != casterID) {
            let xDiff = players[playerID].x - players[casterID].x;
            let yDiff = players[playerID].y - players[casterID].y;
            distance = Math.round(Math.hypot(xDiff, yDiff));
            if (distance != 0 && distance < 200) {
                distanceNerf = distance < 50 ? 50 : distance;
                players[playerID].knockbackX = (200 / distanceNerf) * (xDiff / distance) * multiplier;
                players[playerID].knockbackY = (200 / distanceNerf) * (yDiff / distance) * multiplier;
            }
        }
    });
}

module.exports = {Fireball, calcSpeed, teleport, airwave}