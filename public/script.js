const canvas = document.getElementById("game_canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth
canvas.height = window.innerHeight
ctx.font = "12px serif";
let socket = io();


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

canvas.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "q":
            socket.emit('fireball', mouse);
            fireballs.push(new Fireball(players[socket.id].x, players[socket.id].y, mouse.x, mouse.y, socket.id));
            break;
        case "e":
            socket.emit('teleport', mouse);
            teleport(players[socket.id], mouse);
            // socket.emit("moveClick", {'x': mouse.x, 'y': mouse.y})
            players[socket.id].calcSpeed(mouse.x, mouse.y);
            break;
        case "s":
            socket.emit("airwave");
            break;
        case "d":
            players[socket.id].calcSpeed(players[socket.id].x, players[socket.id].y);
            // socket.emit("moveClick", {'x': players[socket.id].x, 'y': players[socket.id].y})
            break;
        default:
            break;
    }
});

canvas.addEventListener("mousemove", (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
})

canvas.addEventListener("click", (event) => {
    players[socket.id].calcSpeed(event.x, event.y);
    console.log(socket.id);
    socket.emit("moveClick", {'x': event.x, 'y': event.y})
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

socket.on("fireball", (fb) => {
    fireballs.push(new Fireball(fb.x, fb.y, fb.targetPosX, fb.targetPosY, fb.playerID));
});

socket.on('teleport', (tp) => {
    console.log(tp);
    console.log(tp.playerID);
    teleport(players[tp.playerID], tp.pos);
});

socket.on('airwave', (id) => {
    explosionsWaves.push(new ExplosionWave(players[id].x, players[id].y, 19, "255,255,255"));   
})

setInterval(() => {
    players[socket.id].move();
    handleFireballs();
}, 15);

function animate(){
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawLoops(players);
    handleParticles();
    handleExplosionWaves();
    handleHealthNumbers();
    requestAnimationFrame(animate);
}
animate();