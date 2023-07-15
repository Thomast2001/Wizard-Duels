class Particle {
    constructor(x, y, color) {
      this.x = x + Math.random()*8 - 4;
      this.y = y + Math.random()*8 - 4;
      this.speedX = Math.random()*2 - 1;
      this.speedY = Math.random()*2 - 1;
      this.radius = Math.round(Math.random()*2 + 1);
      this.color = color;
    };

    move() {
        this.radius -= 0.1;
        this.x += this.speedX;
        this.y += this.speedY;
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
      ctx.fill();
    }
}