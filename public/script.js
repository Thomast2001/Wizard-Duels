const canvas = document.getElementById("game_canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth
canvas.height = window.innerHeight
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

// class player{
//     constructor(color){
//         this.y = 200
//         this.x = 200; // b = y - ax
//         this.health = 100;
//         this.color = color
//         this.speedTotal = 1;
//         this.speedX = 5;
//         this.speedY = 5;
//         this.targetPosX = undefined;
//         this.targetPosY = undefined;
//         this.knockbackX = 0;
//         this.knockbackY = 0;
//     }

//     calcSpeed(mouseX, mouseY) {
//         this.targetPosX = mouseX;
//         this.targetPosY = mouseY;
//         let xDiff = mouseX - this.x;
//         let yDiff = mouseY - this.y;

//         let hyp = Math.hypot(xDiff, yDiff)

//         this.speedX = xDiff / hyp * this.speedTotal
//         this.speedY = yDiff / hyp * this.speedTotal
//     }

//     move() {
//         if (this.x < this.targetPosX + Math.abs(this.speedX) && this.x > this.targetPosX - Math.abs(this.speedX)) {
//             this.speedX = 0;
//             this.speedY = 0;
//         }

//         this.x += this.speedX;
//         this.y += this.speedY;
        
//     }

//     draw() {
//         ctx.fillStyle = this.color;
//         ctx.beginPath();
//         ctx.arc(this.x, this.y, 20, 0, 2 * Math.PI);
//         ctx.fill();
//     }
// }

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
let particles = []

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
    players[newPlayer.id] = new Player(newPlayer.color)
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
    drawLoops(players);
    requestAnimationFrame(animate);
}
animate();