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
            fireballs.push(new Fireball(players[socket.id].x, players[socket.id].y, mouse.x, mouse.y, socket.id));
            socket.emit('fireball', mouse);
            break;
        case "a":
            players[socket.id].x -= 50
            break;
        case "s":
            players[socket.id].y += 5
            break;
        case "d":
            players[socket.id].x += 5
            break;
        default:
            console.log("somekey");
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
    for (let playerId in players) {
        if (playerId == socket.id){
            players[playerId].x = updatedPlayers[playerId].x;
            players[playerId].y = updatedPlayers[playerId].y;
            
            // console.log("calculate actual posistion"); // ja gør det tak
        } else{
            players[playerId].x = updatedPlayers[playerId].x;
            players[playerId].y = updatedPlayers[playerId].y;
        }
    }
})

socket.on("fireball", (fb) => {
    fireballs.push(new Fireball(fb.x, fb.y, fb.targetPosX, fb.targetPosY, fb.playerID));
});

setInterval(() => {
    players[socket.id].move();
    handleFireballs();
}, 15);

function animate(){
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    handleParticles();
    handleExplosionWaves();
    drawLoops(players);
    requestAnimationFrame(animate);
}
animate();