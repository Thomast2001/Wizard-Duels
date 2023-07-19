class Player{
    constructor(color, name){
        this.y = 200
        this.x = 200; // b = y - ax
        this.health = 100;
        this.color = color
        this.speedTotal = 2;
        this.speedX = 0;
        this.speedY = 0;
        this.targetPosX = undefined;
        this.targetPosY = undefined;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.name = name
        this.nameWidth = ctx.measureText(name).width;
    }

    calcSpeed(mouseX, mouseY) {
        let xDiff = mouseX - this.x;
        let yDiff = mouseY - this.y;

        if (xDiff != 0 && yDiff != 0) {
            this.targetPosX = mouseX;
            this.targetPosY = mouseY;
            let hyp = Math.hypot(xDiff, yDiff);
            this.speedX = xDiff / hyp * this.speedTotal;
            this.speedY = yDiff / hyp * this.speedTotal;
        }
    }

    updateHealth(health, playerID) {
        if (this.health != health) {
            healthNumbers.push(new healthChangeNumber(this.x, this.y, health-this.health, playerID));
            this.health = health; 
        }
    }

    move() {
        if (this.x < this.targetPosX + Math.abs(this.speedX) && this.x > this.targetPosX - Math.abs(this.speedX)) {
            this.speedX = 0;
            this.speedY = 0;
        }
        this.x += this.speedX;
        this.y += this.speedY;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, 2 * Math.PI);
        ctx.fill();

        // Name
        ctx.fillStyle = "grey";
        ctx.fillText(this.name, this.x - this.nameWidth/2, this.y - 35)
        
        // Health
        ctx.font = "12px serif";
        ctx.strokeStyle = "grey";
        ctx.fillStyle = "rgba(0,255,0,100)";
        ctx.fillRect(this.x-25, this.y-26, this.health / 100 * 48, 3)
        ctx.beginPath();
        ctx.strokeRect(this.x-26, this.y - 27, 50, 5);
        ctx.stroke();
    }
}