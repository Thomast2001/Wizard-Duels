class Fireball{
    constructor(posX, posY, mouseX, mouseY){
        this.x = posX;
        this.y = posY;
        this.speed = calcSpeed(posX, posY, mouseX, mouseY, 5);
    }

    move() {
        this.x += this.speed.x;
        this.y += this.speed.y;
    }

    draw() {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, 2 * Math.PI);
        ctx.fill();
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