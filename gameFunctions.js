const A = require('./serverClasses/abilities');

function checkPlayerOutsideArena(player) {
    if ((player.x < 270 || player.x > 1520 || player.y < 130 || player.y > 710) && player.health > 0) {
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
        players[id].health = players[id].maxHealth;
        players[id].speedX = 0;
        players[id].speedY = 0;
        players[id].knockbackX = 0;
        players[id].knockbackY = 0;
    });
    io.to(room.name).emit("updatePlayers", updatedPlayers);
}


        //////////////
        // Abilites //
        //////////////

function fireball(player, id, socket, currentRoom, targetPos, fireballs, upgrades) {
    if (player.health > 0 && !player.stunned 
                    && !player.onCooldown['fireball'] && player.levels.Fireball > 0) {
        const fireballLevel = player.levels.Fireball;
        fireballs[currentRoom].push(new A.Fireball(player.x, player.y, 
                    targetPos.x, targetPos.y, id, upgrades.Fireball.speed[fireballLevel], upgrades.Fireball.damage[fireballLevel]));

        socket.to(currentRoom).emit('fireball', {'x': player.x, 'y': player.y,
                        'targetPosX': targetPos.x, 'targetPosY': targetPos.y, 'playerID': id})
        player.cooldown('fireball', 950);
    }
}

function airwave(id, io, currentRoom, players, upgrades, playerIDs) {
    const player = players[id];
    if (player.health > 0 && !player.stunned 
                    && !player.onCooldown['airwave'] && player.levels.Airwave > 0) {
        io.to(currentRoom).emit('airwave', id);
        const airwaveLevel = player.levels.Airwave;
        const pushMultiplier = upgrades.Airwave.pushMultiplier[airwaveLevel]
        const cooldown = upgrades.Airwave.cooldown[airwaveLevel] * 1000;
        A.airwave(players, id, playerIDs, pushMultiplier);
        player.cooldown('airwave', cooldown - 50);
    }
}


function teleport(player, id, socket, currentRoom, pos, upgrades) {
    if (player.health > 0 && !player.stunned 
                    && !player.onCooldown['teleport'] && player.levels.Teleport > 0) {
        player.calcSpeed(pos.x, pos.y);
        A.teleport(player, pos, upgrades);
        const teleportLevel = player.levels.Teleport;
        let cooldown = upgrades.Teleport.cooldown[teleportLevel] * 1000;
        if (player.isAI && player.difficulty == 1) { // Unfair AI gets a 50% cooldown reduction on teleport
            cooldown *= 0.5;
        }
        socket.to(currentRoom).emit('teleport', {'playerID': id, 'pos': pos})
        player.cooldown('teleport', cooldown - 50);
    }
}

function lightning(player, socket, currentRoom, players, upgrades, lightning) {
    console.log(lightning)
    if (player.health > 0 && !player.stunned 
            && !player.onCooldown['lightning'] && player.levels.Lightning > 0) {
        const lightningLevel = player.levels.Lightning;
        const cooldown = upgrades.Lightning.cooldown[lightningLevel] * 1000;
        const playerHit = players[lightning.playerHit]
        if (lightning.playerHit) {
            playerHit.health -= upgrades.Lightning.damage[lightningLevel];
            playerHit.stun(1500, players, lightning.playerHit); // Stun the player hit
        }
        socket.to(currentRoom).emit('lightning', lightning)
        player.cooldown('lightning', cooldown - 50);
    }
}



module.exports = { checkPlayerOutsideArena, resetPlayers, fireball, airwave, teleport, lightning }
