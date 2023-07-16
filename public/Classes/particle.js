class Particle {
    constructor(x, y, speed, radius, color) {
      this.x = x + Math.random()*8 - 4;
      this.y = y + Math.random()*8 - 4;
      this.speedX = Math.random()*speed - speed/2;
      this.speedY = Math.random()*speed - speed/2;
      this.radius = Math.round(Math.random()*radius + 1);
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
      ctx.arc(this.x, this.y, Math.round(this.radius), 0, 2 * Math.PI);
      ctx.fill();
    }
}