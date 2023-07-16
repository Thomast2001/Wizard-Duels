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

class ExplosionWave{
  constructor(x, y, expandSpeed, rgb) {
    this.x = x;
    this.y = y;
    this.expandSpeed = expandSpeed;
    this.radius = 5;
    this.rgb = rgb;
    console.log(rgb)
    this.alpha = 100;
  };

  update() {
    this.radius += this.expandSpeed;
    this.alpha -= 10;
  }

  draw() {
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${this.rgb}, ${this.alpha}%)`;
    console.log(`rgba(${this.rgb}, ${this.alpha}%)`);
    ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}