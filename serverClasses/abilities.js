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

    collisionCheck(index, fireballs, players) {
        for (let id in players) {
            if (this.playerID != id &&
                this.x > players[id].x - 20 && this.x < players[id].x + 20 &&
                this.y > players[id].y - 20 && this.y < players[id].y + 20) {
                    console.log("1");
                    players[id].knockback(this.speed.x * 2, this.speed.y * 2);
                    console.log("2");
                    fireballs.splice(index, 1);
                    console.log(players[id])
            }
        }
        if (this.x < 0 || this.x > 2000 || this.y < 0 || this.y > 2000){
            fireballs.splice(index,1);
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

module.exports = {Fireball, calcSpeed}