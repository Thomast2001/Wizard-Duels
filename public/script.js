const canvas = document.getElementById("game_canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1800;
canvas.height = 900;
ctx.font = "12px PressStart2P";
let socket = io();
console.log(window.location.href);
background = new Image();
background.src = window.location.href + "Arena.png";

let mouse = {
    "x": undefined,
    "y": undefined
};

canvas.addEventListener("resize", () =>{
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight  
});

let players = {};
let fireballs = [];
let particles = [];
let healthNumbers = [];
let explosionsWaves = [];
let lightnings = [];
let cooldownSeconds = {Fireball: 0, Airwave: 0, Teleport: 0, Lightning: 0};
let abilityCooldowns = {Fireball: 1, Airwave: 10, Teleport: 7.5, Lightning: 15};
let gamePlaying = false;

canvas.addEventListener("keydown", (event) => {
    event.preventDefault();
    if (players[socket.id].health > 0 && !players[socket.id].stunned && gamePlaying) {
        switch (event.code) {
            case "KeyQ":
                if (!cooldownSeconds.Fireball && players[socket.id].levels.Fireball > 0) {
                    socket.emit('fireball', mouse);
                    playSound(attackSounds);
                    const fireball = new Fireball(players[socket.id].x, players[socket.id].y, 
                                mouse.x, mouse.y, socket.id, players[socket.id].levels.Fireball)
                    fireballs.push(fireball);
                    players[socket.id].changeOrientation(mouse.x - players[socket.id].x);
                    players[socket.id].changeAnimationState("attack");
                    cooldown(cooldownSeconds, "Fireball", abilityCooldowns.Fireball);
                }
                break;
            case "KeyW":
                if (!cooldownSeconds.Airwave && players[socket.id].levels.Airwave > 0) {
                    socket.emit("airwave");
                    cooldown(cooldownSeconds, "Airwave", abilityCooldowns.Airwave);
                }
                break;
            case "KeyE":
                if (!cooldownSeconds.Teleport && players[socket.id].levels.Teleport > 0) {
                    socket.emit('teleport', mouse);
                    players[socket.id].calcSpeed(mouse.x, mouse.y);
                    players[socket.id].changeOrientation(mouse.x - players[socket.id].x);
                    teleport(players[socket.id], mouse, upgrades);
                    cooldown(cooldownSeconds, "Teleport", abilityCooldowns.Teleport);
                }
                break;
            case "KeyR":
                if (!cooldownSeconds.Lightning && players[socket.id].levels.Lightning > 0) {
                    let lightning = createLightning(lightnings, mouse.x, mouse.y);
                    let playerHit = lightning.collisionCheck(players); // check if lightning hit a player
                    if (playerHit) {
                        socket.emit("lightning", { playerHit: playerHit })
                        players[playerHit].stun(1500, players, playerHit); // Stun the player hit
                    } else {
                        socket.emit("lightning", { x: mouse.x, y: mouse.y })
                    }
                    cooldown(cooldownSeconds, "Lightning", abilityCooldowns.Lightning);
                }
                break;
            default:
                break;
        }
    }
});

window.addEventListener("mousemove", (event) => {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
    scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for x
    scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y

    mouse.x = (event.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
    mouse.y = (event.clientY - rect.top) * scaleY     // been adjusted to be relative to element
})

canvas.addEventListener("click", (event) => {
    players[socket.id].calcSpeed(mouse.x, mouse.y);
    socket.emit("moveClick", {'x': mouse.x, 'y': mouse.y})
})

socket.on("newPlayer", (newPlayer) => {
    addPlayerToList(newPlayer.id, newPlayer.color, newPlayer.name);
    players[newPlayer.id] = new Player(newPlayer.color, newPlayer.name)

    for (const [key, value] of Object.entries(obj)) { // Set the levels of the new player
        players[newPlayer.id].levels[key] = value;
        if (key == 'Health') {
            players[newPlayer.id].maxHealth += 20 * value;
        } else if (key == 'Boots') {
            players[newPlayer.id].speedTotal += 0.25 * value;
        }
    }
})

socket.on("playerDisconnect", (playerId) => {
    document.getElementById(playerId).remove();
    delete players[playerId];
})

socket.on("ready", (id) => {
    document.getElementById(id).style.backgroundColor = "rgba(4, 255, 63, 0.7)";
})

socket.on("unready", (id) => {
    document.getElementById(id).style.backgroundColor = "rgba(255, 8, 0, 0.7)";
})

socket.on("color", (msg) => {
    changePlayerImg(msg.playerID, msg.color);
    players[msg.playerID].color = msg.color;
})

socket.on("unreadyAll", (id) => {
    for (let playerID in players) {
        document.getElementById(playerID).style.backgroundColor = "rgba(255, 8, 0, 0.7)";
        players[playerID].ready = false;
    }
    readyButton.classList.remove("is-error");
    readyButton.textContent = "Ready up!";
})

socket.on("updateGold", (gold) => { updateGold(gold) });

socket.on("error", (errorMessage) => errorPopup(errorMessage));

socket.on("upgradePurchased", (shop) => upgradePurchased(players, shop.playerID, shop.purchased, abilityCooldowns));

socket.on("startGame", () => {
    for (let playerID in players) {
        players[playerID].dead = false;
        if (animationIndexes[players[playerID].animationIndex] == "death"){
            players[playerID].changeAnimationState("idle");
        }
    }
    gamePlaying = true;
    document.querySelector("#game_menu").style.display = "none"
    document.querySelector("#hud").style.display = "flex"
})

socket.on("endGame", (winnerID) => {
    if (winnerID != null) {
        const trophyElement = document.createElement('i');
        trophyElement.className = 'nes-icon trophy is-small';
        document.querySelector(`#${winnerID}`).appendChild(trophyElement);
    }
    setTimeout(() => {
        for (let playerID in players) {
            players[playerID].dead = false;
        }
        gamePlaying = false;
        document.querySelector("#game_menu").style.display = "block"
        document.querySelector("#hud").style.display = "none"
    }, 2000);
})

socket.on("gameOver", (winnerName) => {
    setTimeout(() => {
        socket.emit('leaveLobby');
        reset();
        resetShop();
        document.querySelector('#game_menu').style.display = "block";
        errorPopup(winnerName + " won the game!");
    }, 1500);
})

socket.on("updatePlayers", (updatedPlayers) => {
    for (let playerID in players) {
        players[playerID].updateHealth(updatedPlayers[playerID].health, playerID);

        if (playerID == socket.id){  // Might add player movement prediction later here
            players[playerID].x = updatedPlayers[playerID].x;
            players[playerID].y = updatedPlayers[playerID].y;
            
            healthBarText.innerText = players[socket.id].health + "/" + players[socket.id].maxHealth;
            healthBar.value = players[socket.id].health;
        } else{
            players[playerID].x = updatedPlayers[playerID].x;
            players[playerID].y = updatedPlayers[playerID].y;
        }
    }
})

socket.on("move", (playerMove) => {
    players[playerMove.id].calcSpeed(playerMove.x, playerMove.y);
})

socket.on("fireball", (fb) => {
    playSound(attackSounds);
    const fireball = new Fireball(fb.x, fb.y, fb.targetPosX, fb.targetPosY, fb.playerID, players[fb.playerID].levels.Fireball)
    fireballs.push(fireball);
    players[fb.playerID].changeOrientation(fb.targetPosX - players[fb.playerID].x);
    players[fb.playerID].changeAnimationState("attack");
});

socket.on('teleport', (tp) => {
    players[tp.playerID].calcSpeed(tp.pos.x, tp.pos.y);
    teleport(players[tp.playerID], tp.pos, upgrades);
});

socket.on('airwave', (id) => {
    playSound(airwaveSounds);
    explosionsWaves.push(new ExplosionWave(players[id].x, players[id].y, 19, "255,255,255"));   
})

socket.on('lightning', (lightning) => {
    if (lightning.playerHit) {
        createLightning(lightnings, players[lightning.playerHit].x, players[lightning.playerHit].y);
        players[lightning.playerHit].stun(1500, players, lightning.playerHit); // Stun the player hit
    } else {
        createLightning(lightnings, lightning.x, lightning.y);
    }
});

setInterval(() => {
    for (let id in players) {
        players[id].move();
    }
    handleFireballs();
}, 15);

setInterval(() => {
    for (let id in players) {
        players[id].handleAnimation();
    }
}, 95);

setInterval(() => {
    updateCooldown(cooldownSeconds, abilityCooldowns);
}, 100);

function animate(){
    ctx.drawImage(background, 0, 0);
    if (gamePlaying == true) { 
        drawLoops(players);
        handleParticles();
        handleExplosionWaves();
        handleHealthNumbers();
        handleLightnings();
    }
    requestAnimationFrame(animate);
}

document.onload = animate();