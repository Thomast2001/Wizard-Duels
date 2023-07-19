class Fireball{
    constructor(posX, posY, mouseX, mouseY, playerID){
        this.x = posX;
        this.y = posY;
        this.speed = calcSpeed(posX, posY, mouseX, mouseY, 5);
        this.playerID = playerID;
    }

    move() {
        this.x += this.speed.x;
        this.y += this.speed.y;
    }

    draw() {
        ctx.fillStyle = "rgb(255, 100,0)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    collisionCheck(index, fireballs, players) {
        for (let id in players) {
            if (this.playerID != id &&
                this.x > players[id].x - 20 && this.x < players[id].x + 20 &&
                this.y > players[id].y - 20 && this.y < players[id].y + 20) {
                    this.explode(); 
                    fireballs.splice(index,1);
            }
        }
    }

    explode() {
        for (let i = 0; i < 50; i++) {
            particles.push(new Particle(this.x, this.y, 10, 3,
                `hsla(${Math.floor(Math.random()*30)}, ${Math.floor(Math.random()*100)}%, 50%, 100%)`));
        }
        explosionsWaves.push(new ExplosionWave(this.x, this.y, 8, '255, 255, 255'));
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

// class teleport{
//     constructor(pos){
//         this.pos = pos
//         this.cooldown = 10;
//     }

//     cast(player){
//         for (let i = 0; i < 5; i++) {
//             for (let j = 0; j < 5; j++) {
//                 particles.push(new Particle(player.x - 5 + 2*i, player.y - 5 + 2*j, 1, 2, "rgba(0,255,255,150)"));
//                 particles.push(new Particle(this.pos.x - 5 + 2*i, this.pos.y - 5 + 2*j, 1, 2, "rgba(0,255,255,150)"));
//             }
//         }
//         player.x = this.pos.x
//         player.y = this.pos.y
//     }
// }

function teleport(player, pos){
    console.log(pos);
    let teleportPos = {'x': pos.x, 'y': pos.y}
    let maxTeleportDist = 200;
    let xDiff = teleportPos.x - player.x;
    let yDiff = teleportPos.y - player.y;
    let distance = Math.hypot(xDiff, yDiff);
    if (distance > maxTeleportDist) {
        teleportPos.x = player.x + xDiff * (maxTeleportDist/distance);
        teleportPos.y = player.y + yDiff * (maxTeleportDist/distance);
    }
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            particles.push(new Particle(player.x - 16 + 8*i, player.y - 16 + 8*j, 1, 3, "rgba(0,255,255,150)"));
            particles.push(new Particle(teleportPos.x - 20 + 10*i, teleportPos.y - 20 + 10*j, 1, 3, "rgba(0,255,255,150)"));
        }
    }
    player.x = teleportPos.x
    player.y = teleportPos.y
}