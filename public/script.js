const canvas = document.getElementById("game_canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1800;
canvas.height = 900;
ctx.font = "12px serif";
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

ctx.beginPath();
ctx.fillStyle = "red";
ctx.fillRect(50,50,50,50);
ctx.fill();

function drawLoops(players){
    fireballs.forEach((fireball) => {
        fireball.draw();
    })

    for (let id in players) {
        players[id].draw();
    }
}


let players = {};
let fireballs = [];
let particles = [];
let healthNumbers = [];
let explosionsWaves = [];
let lightnings = [];

function collisionWithPlayer(obj){
    for (let id in players) {
        if (fireball.playerID != id &&
            fireball.x > players[id].x - 20 && fireball.x < players[id].x + 20 &&
            fireball.y > players[id].y - 20 && fireball.y < players[id].y + 20) {
                fireball.explode(); 
                fireballs.splice(index,1);
        }
    }
}

function handleFireballs(){
    fireballs.forEach((fireball, index) => {
        fireball.move();
        if (fireball.x < 0 || fireball.x > canvas.width || fireball.y < 0 || fireball.y > canvas.height){
            fireballs.splice(index,1);
        }
        fireball.collisionCheck(index, fireballs, players);
        particles.push(new Particle(fireball.x, fireball.y, 2, 2, `hsla(${Math.floor(Math.random()*30)}, 100%, 50%, 70%)`)); // `hsl(${Math.random()*30+90}, 100,100)`
    })
}

function handleParticles(){
    particles.forEach((particle, index) => {
        particle.move();
        if (particle.radius < 1){
            particles.splice(index,1);
        }
        particle.draw();        
    });
}

function handleHealthNumbers(){
    healthNumbers.forEach((number, index) => {
        number.draw(players);    
        number.move();
        if (number.speedY > 5){
            healthNumbers.splice(index,1);
        }
    });
}

function handleExplosionWaves(){
    explosionsWaves.forEach((explosion, index) => {
        explosion.draw();        
        explosion.update();
        if (explosion.alpha < 1){
            explosionsWaves.splice(index,1);
        }
    });
}

function handleLightnings(){
    lightnings.forEach( (lightning, index) => {
        lightning.draw();
        lightning.framesLeft--;
        if (lightning.framesLeft < 0){
            lightnings.splice(index,1);
        }
    });
}

canvas.addEventListener("keydown", (event) => {
    if (players[socket.id].health > 0 && !players[socket.id].stunned) {
        switch (event.key) {
            case "q":
                socket.emit('fireball', mouse);
                fireballs.push(new Fireball(players[socket.id].x, players[socket.id].y, mouse.x, mouse.y, socket.id));
                players[socket.id].changeOrientation(mouse.x - players[socket.id].x);
                players[socket.id].changeAnimationState("attack");
                //players[socket.id].speedX = 0;
                //players[socket.id].speedY = 0;
                break;
            case "w":
                socket.emit("airwave");
                break;
            case "e":
                socket.emit('teleport', mouse);
                players[socket.id].calcSpeed(mouse.x, mouse.y);
                players[socket.id].changeOrientation(mouse.x - players[socket.id].x);
                teleport(players[socket.id], mouse);
                // socket.emit("moveClick", {'x': mouse.x, 'y': mouse.y})
                break;
            case "r":
                let lightning = createLightning(lightnings, mouse.x, mouse.y);
                let playerHit = lightning.collisionCheck(players); // check if lightning hit a player
                if (playerHit) {
                    socket.emit("lightning", { playerHit: playerHit })
                    players[playerHit].stun(5000, players, playerHit); // Stun the player hit
                } else {
                    socket.emit("lightning", { x: mouse.x, y: mouse.y })
                }
                break;
            case "d":
                players[socket.id].calcSpeed(players[socket.id].x, players[socket.id].y);
                // socket.emit("moveClick", {'x': players[socket.id].x, 'y': players[socket.id].y})
                break;
            default:
                break;
        }
    }
});

canvas.addEventListener("mousemove", (event) => {
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
    players[newPlayer.id] = new Player(newPlayer.color, newPlayer.name)
})

socket.on("playerDisconnect", (playerId) => {
    delete players[playerId];
})

socket.on("updatePlayers", (updatedPlayers) => {
    for (let playerID in players) {
        players[playerID].updateHealth(updatedPlayers[playerID].health, playerID);

        if (playerID == socket.id){
            players[playerID].x = updatedPlayers[playerID].x;
            players[playerID].y = updatedPlayers[playerID].y;
            
            // console.log("calculate actual posistion"); // ja gør det tak
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
    fireballs.push(new Fireball(fb.x, fb.y, fb.targetPosX, fb.targetPosY, fb.playerID));
    players[fb.playerID].changeOrientation(fb.targetPosX - players[fb.playerID].x);
    players[fb.playerID].changeAnimationState("attack");
});

socket.on('teleport', (tp) => {
    players[tp.playerID].calcSpeed(tp.pos.x, tp.pos.y);
    teleport(players[tp.playerID], tp.pos);
});

socket.on('airwave', (id) => {
    explosionsWaves.push(new ExplosionWave(players[id].x, players[id].y, 19, "255,255,255"));   
})

socket.on('lightning', (lightning) => {
    if (lightning.playerHit) {
        createLightning(lightnings, players[lightning.playerHit].x, players[lightning.playerHit].y);
        players[lightning.playerHit].stun(5000, players, lightning.playerHit); // Stun the player hit
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
}, 110);

function animate(){
    ctx.fillStyle = "rgb(86,26,4)";
    //ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0);
    drawLoops(players);
    handleParticles();
    handleExplosionWaves();
    handleHealthNumbers();
    handleLightnings();
    requestAnimationFrame(animate);
}
animate();