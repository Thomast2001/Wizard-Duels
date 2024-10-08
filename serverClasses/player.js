class Player{
    constructor(color, name, id){
        this.x = 200;
        this.y = 200;
        this.health = 100;
        this.maxHealth = 100;
        this.color = color
        this.speedTotal = 2;
        this.speedX = 0;
        this.speedY = 0;
        this.targetPosX = undefined;
        this.targetPosY = undefined;
        this.knockbackX = 0;
        this.knockbackY = 0; 
        this.name = name;
        this.id = id;
        this.stunned = false;
        this.onCooldown = {fireball: false, airwave: false, teleport: false, lightning: false};
        this.ready = false;
        this.gold = 250;
        this.levels = {Fireball: 1, Airwave: 0, Teleport: 0, Lightning: 0, Health: 0, Boots: 0};
        this.wins = 0;
        this.isAI = false;
    }

    calcSpeed(mouseX, mouseY) {
        let xDiff = mouseX - this.x;
        let yDiff = mouseY - this.y;

        if (xDiff != 0 && yDiff != 0) {
            this.targetPosX = mouseX;
            this.targetPosY = mouseY;

            let hyp = Math.hypot(xDiff, yDiff)

            this.speedX = xDiff / hyp * this.speedTotal
            this.speedY = yDiff / hyp * this.speedTotal
        }
    }

    move() {
        if (this.health > 0 && !this.stunned){
            if (this.x <= this.targetPosX + Math.abs(this.speedX) && this.x >= this.targetPosX - Math.abs(this.speedX) &&
                this.y <= this.targetPosY + Math.abs(this.speedY) && this.y >= this.targetPosY - Math.abs(this.speedY)) {
                this.speedX = 0;
                this.speedY = 0;
            }
            this.x = this.x + this.speedX + this.knockbackX;
            this.y = this.y + this.speedY + this.knockbackY;
        } else{
            this.x += this.knockbackX;
            this.y += this.knockbackY;
        }
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

    stun(msStunned, players, id) {
        this.stunned = true;
        this.speedX = 0;
        this.speedY = 0;
        setTimeout(() => {
            if (players[id]) { // Check if player is still connected to the server ro prevent server crash
                players[id].stunned = false; 
            }
        }, msStunned);
    }

    cooldown(ability, cooldown){
        this.onCooldown[ability] = true; 
        setTimeout(() => {
            this.onCooldown[ability] = false; 
        }, cooldown);
    }
}

module.exports = Player