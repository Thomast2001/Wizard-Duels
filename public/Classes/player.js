spriteSheet = new Image();
spriteSheet.src = window.location.href + "AnimationSheet_Character.png";
const spriteSize = 32;
let frameDelay = 30;

class Player{
    constructor(color, name){
        this.y = 200
        this.x = 200; 
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
        this.frameX = 0; // used for animation
        this.frameY = 0;
        this.animationFrame = 0;
        this.animationIndex = 0;
        this.frames;
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
            this.changeOrientation(xDiff)
            this.changeAnimationState("run");
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
            this.changeAnimationState("idle");
        }
        this.x += this.speedX;
        this.y += this.speedY;
    }
    
    changeOrientation(xDiff){
        if (xDiff > 0) {
            this.orientation = 0; // right
        } else {
            this.orientation = 1; // left
        }
    }

    changeAnimationState(newState) {
        if (newState != animationStates[this.animationIndex].name){
            this.animationFrame = 0;
            this.animationIndex = animationIndexes.indexOf(newState);
        }
        this.frameY = spriteSize * this.animationIndex + this.orientation * 4 * spriteSize;
    }


    handleAnimation() {
        this.frameX = spriteSize * this.animationFrame;
        frameDelay--;
        if (frameDelay == 0) {
            frameDelay = animationStates[this.animationIndex].delay;
            this.animationFrame++;
            if (this.animationFrame > animationStates[this.animationIndex].frames) {
                if (animationStates[this.animationIndex].name != "attack") {
                    this.animationFrame = 0;
                } else if (this.speedX != 0){        // go back to idle/run when finished casting ability
                    this.changeOrientation(this.targetPosX - this.x)
                    this.changeAnimationState("run"); 
                } else {
                    this.changeAnimationState("idle");
                }
            }
        }
    }

    draw() {
//       ctx.fillStyle = this.color;
//        ctx.beginPath();
//        ctx.arc(this.x, this.y, 20, 0, 2 * Math.PI);
//        ctx.fill();
        ctx.drawImage(spriteSheet, this.frameX, this.frameY, spriteSize, spriteSize, this.x-spriteSize, this.y-spriteSize, spriteSize*2, spriteSize*2);

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

const animationStates = [
    {
        name: 'idle',
        frames: 14,
        delay: 40
    },
    {
        name: 'run',
        frames: 7,
        delay: 30
    },
    {
        name: 'death',
        frames: 7,
        delay: 30
    },
    {
        name: 'attack',
        frames: 3,
        delay: 20
    },
    {
        name: 'idleLeft',
        frames: 14,
        delay: 40
    },
    {
        name: 'runLeft',
        frames: 7,
        delay: 30
    },
    {
        name: 'deathLeft',
        frames: 7,
        delay: 30
    },
    {
        name: 'attackLeft   ',
        frames: 3,
        delay: 20
    },
];

const animationIndexes = ['idle', 'run', 'death', 'attack', 'idleLeft', 'runLeft', 'deathLeft', 'attackLeft'];