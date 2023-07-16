class Player{
    constructor(color){
        this.y = 200
        this.x = 200;
        this.health = 100;
        this.color = color
        this.speedTotal = 1;
        this.speedX = 0;
        this.speedY = 0;
        this.targetPosX = undefined;
        this.targetPosY = undefined;
        this.knockbackX = 0;
        this.knockbackY = 0;
    }

    calcSpeed(mouseX, mouseY) {
        this.targetPosX = mouseX;
        this.targetPosY = mouseY;
        let xDiff = mouseX - this.x;
        let yDiff = mouseY - this.y;

        let hyp = Math.hypot(xDiff, yDiff)

        this.speedX = xDiff / hyp * this.speedTotal
        this.speedY = yDiff / hyp * this.speedTotal
    }

    move() {
        if (this.x < this.targetPosX + Math.abs(this.speedX) && this.x > this.targetPosX - Math.abs(this.speedX)) {
            this.speedX = 0;
            this.speedY = 0;
        }
        this.x = this.x + this.speedX + this.knockbackX;
        this.y = this.y + this.speedY + this.knockbackY;
        this.reduceKnockback();
    }

    knockback(x, y){
        this.knockbackX += x;
        this.knockbackY += y;
        this.speedX = 0;
        this.speedY = 0;
    }

    reduceKnockback() {
        if (this.knockbackX > 0.2 || this.knockbackX < -0.2 || this.knockbackY > 0.2 || this.knockbackY < -0.2) {
            console.log(this.knockbackX, this.knockbackY);
            this.knockbackX *= 0.95;
            this.knockbackY *= 0.95;
            if (this.knockbackX <= 0.2 && this.knockbackX >= -0.2) {
                this.knockbackX = 0;
            }
            if (this.knockbackY <= 0.2 && this.knockbackY >= -0.2) {
                this.knockbackY = 0;
            }
        } 
    }
}

module.exports = Player