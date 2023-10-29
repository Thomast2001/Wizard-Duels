class Fireball{
    constructor(posX, posY, mouseX, mouseY, playerID, level){
        this.x = posX;
        this.y = posY;
        this.speed = calcSpeed(posX, posY, mouseX, mouseY, upgrades.Fireball.speed[level]);
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
            if (this.playerID != id && players[id].health > 0 &&
                this.x > players[id].x - 20 && this.x < players[id].x + 20 &&
                this.y > players[id].y - 20 && this.y < players[id].y + 20) {
                    playSound(explosionSounds);
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

function teleport(player, pos, upgrades){
    playSound(teleportSounds);
    let teleportPos = {'x': pos.x, 'y': pos.y}
    let maxTeleportDist = upgrades.Teleport.range[player.levels.Teleport];
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


class Lightning {
    constructor(x, y){
        this.xHit = x;
        this.yHit = y;
        this.x = x;
        this.y = y;
        this.lightningLines = [[x,y]];
        this.framesLeft = 90;
    }

    generateLightning(){
        playSound(lightningSounds);
        while(this.y >= 0) {
            this.x = this.x + Math.round(Math.random() * 70) - 35;
            this.y = this.y - 50;
            this.lightningLines.push([this.x, this.y]);
        }
    }
    
    collisionCheck(players) {
        for (let id in players) {
            if (socket.id != id &&
                this.xHit > players[id].x - 20 && this.xHit < players[id].x + 20 &&
                this.yHit > players[id].y - 20 && this.yHit < players[id].y + 20) {
                    return id;
            }
        }
        return false; // No player hit
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${1 * this.framesLeft}%)`;
        ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.strokeStyle = `rgba(244, 100, 255, ${2 * this.framesLeft}%)`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.lightningLines[0][0], this.lightningLines[0][1]);
        for (let i = 1; i < this.lightningLines.length; i++) {
            ctx.lineTo(this.lightningLines[i][0], this.lightningLines[i][1])
        }
        ctx.stroke();

        ctx.lineWidth = 1;
    }

}

function createLightning(lightnings, x, y){
    let newLightning = new Lightning(x, y);
    newLightning.generateLightning();
    lightnings.push(newLightning);
    return newLightning;
}


