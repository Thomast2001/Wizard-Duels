// Credits: 
// https://codepen.io/franksLaboratory/pen/BaxvVdJ


  class MenuParticle {
    constructor(effect, x, y, color){
        this.effect = effect;
        //this.x = Math.random() * this.effect.canvasWidth;
        //this.y = Math.random() * this.effect.canvasHeight;
        this.x = Math.random() * this.effect.canvasWidth;
        this.y = this.effect.canvasHeight;
        this.originX = x;
        this.originY = y;
        this.size = this.effect.gap;
        this.color = color;
        this.dx = 0;
        this.dy = 0;
        this.vx = 0;
        this.vy = 0;
        this.force = 0;
        this.angle = 0;
        this.distance = 0;
        this.friction = Math.random() * 0.6 + 0.15;
        this.ease = Math.random() * 0.1 + 0.005;
    }
    update(){
        this.dx = mouse.x - this.x;
        this.dy = mouse.y - this.y;
        this.distance = this.dx * this.dx + this.dy * this.dy;
        this.force = -this.effect.mouseradius / this.distance;
        if(this.distance < this.effect.mouseradius) {
            this.angle = Math.atan2(this.dy, this.dx);
            this.vx += this.force * Math.cos(this.angle);
            this.vy += this.force * Math.sin(this.angle);
        }
        this.x += (this.vx *= this.friction) + (this.originX - this.x) * this.ease;
        this.y += (this.vy *= this.friction) + (this.originY - this.y) * this.ease;
    }
    draw(){
      // only change colours when this colour is different than previous
      this.effect.context.fillStyle = this.color;
      this.effect.context.fillRect(this.x, this.y, this.size, this.size);
    }
  }

  class Effect {
    constructor(context, canvasWidth, canvasHeight){
      this.context = context;
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
      this.maxTextWidth = this.canvasWidth * 0.8;
      this.fontSize = 100;
      this.textVerticalOffset = 0;
      this.lineHeight = this.fontSize * 1.2;
      this.textX = this.canvasWidth / 2;
      this.textY = this.canvasHeight / 4.5;
      this.wrapText(" ");

      this.particles = [];
      this.gap = 3;
      this.mouseradius = 20000

    }
    /* Examples of analogous combinations:
    Violet, blue, and teal.
    Red, fuchsia, and purple.
    Red, orange, and yellow.
    Green, blue, and purple.*/
    wrapText(text){
      this.context.font = this.fontSize + 'px Verdana';
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.strokeStyle = 'black';
      this.context.lineWidth = 3;
      this.context.letterSpacing = "10px"; // experimental property
      this.context.imageSmoothingEnabled = false
      //this.context.fillStyle = 'white';
      const edge = this.canvasWidth * 0.2;
      const gradient = this.context.createLinearGradient(edge, edge, this.canvasWidth - edge, this.canvasHeight - edge);
      gradient.addColorStop(0, 'red');
      gradient.addColorStop(0.5, 'orange');
      gradient.addColorStop(1, 'yellow');
      this.context.fillStyle = gradient;
      let linesArray = [];
      let words = text.split(' ');
      let lineCounter = 0;
      let line = '';
      for (let i = 0; i < words.length; i++){
        let testLine = line + words[i] + ' ';
        if (this.context.measureText(testLine).width > this.maxTextWidth){       
          line = words[i] + ' ';
          lineCounter++;
        } else {
          line = testLine;
        }
        linesArray[lineCounter] = line;
      }
      this.textY = this.canvasHeight/4.5;
      linesArray.forEach((el, index) => {
          this.context.fillText(el, this.textX, this.textY + (index * this.lineHeight));
          this.context.strokeText(el, this.textX, this.textY + (index * this.lineHeight));
      });
      this.convertToMenuParticles();
    }
    convertToMenuParticles(){
      this.particles = [];
      const pixels = this.context.getImageData(0, 0, this.canvasWidth, this.canvasHeight).data;
      for(let y = 0; y < this.canvasHeight; y += this.gap) {
          for(let x = 0; x < this.canvasWidth; x += this.gap) {
              const index = (y * this.canvasWidth + x) * 4;
              const alpha = pixels[index + 3];
              if(alpha > 0) {
                const red = pixels[index];
                const green = pixels[index + 1];
                const blue = pixels[index + 2];
                const color = 'rgb(' + red + ',' + green + ',' + blue + ')';
                this.particles.push(new MenuParticle(this, x, y, color));
              }
          }
      }
      this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
    render(){
      this.particles.forEach(particle => {
        particle.update();
        particle.draw();
      })
    }
  }

window.addEventListener('load', function() {
  effect = new Effect(ctx, canvas.width, canvas.height);
  effect.wrapText(" Wizard Duels");
  
  function animate() {
    if (effect){
      effect.render();
    }
    requestAnimationFrame(animate);
  }
  animate();
  
  
});

let effect;

function showGameTitle(){
  effect = new Effect(ctx, canvas.width, canvas.height);
  effect.wrapText(" Wizard Duels");
}

function hideGameTitle() {
  ctx.font = "12px PressStart2P";
  ctx.letterSpacing = "0px";
  effect = null;
}