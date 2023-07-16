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

    explode() {
        for (let i = 0; i < 50; i++) {
            particles.push(new Particle(this.x, this.y, 10, 3,
                `hsla(${Math.floor(Math.random()*30)}, ${Math.floor(Math.random()*100)}%, 50%, 100%)`));
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