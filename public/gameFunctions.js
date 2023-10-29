abilities = ['Fireball', 'Airwave', 'Teleport', 'Lightning'];
hud = {}

for (let i = 0; i < abilities.length; i++) {
    hud[`${abilities[i]}P`] = document.querySelector(`#${abilities[i]}P`)
    hud[`${abilities[i]}Box`] = document.querySelector(`#${abilities[i]}Box`)
}

function cooldown(currentCooldowns, ability, seconds){
    currentCooldowns[ability] = seconds; 
}

function updateCooldown(currentCooldowns, abilityCooldowns){
    for (let ability in currentCooldowns) {
        if (currentCooldowns[ability] > 0) {
            currentCooldowns[ability] = (currentCooldowns[ability] - 0.1);
            if (currentCooldowns[ability] <= 0) {
                hud[`${ability}P`].innerText = "";
            } else {
                hud[`${ability}P`].innerText = currentCooldowns[ability] >= 10 ? Math.floor(currentCooldowns[ability]) : currentCooldowns[ability].toFixed(1);
            }
            hud[`${ability}Box`].style.height = `${currentCooldowns[ability]/abilityCooldowns[ability]*100}%`
        } else { // to fix floating-point error mitigation
            currentCooldowns[ability] = 0; 
        }
    }
}

function handleFireballs(){
    fireballs.forEach((fireball, index) => {
        fireball.move();
        if (fireball.x < 0 || fireball.x > canvas.width || fireball.y < 0 || fireball.y > canvas.height){
            fireballs.splice(index,1);
        }
        fireball.collisionCheck(index, fireballs, players);
        particles.push(new Particle(fireball.x, fireball.y, 2, 2, `hsla(${Math.floor(Math.random()*30)}, 100%, 50%, 70%)`)); // `hsl(${Math.random()*30+90}, 100,100)`
    })
}

function handleParticles(){
    particles.forEach((particle, index) => {
        particle.move();
        if (particle.radius < 1){
            particles.splice(index,1);
        }
        particle.draw();        
    });
}

function handleHealthNumbers(){
    healthNumbers.forEach((number, index) => {
        number.draw(players);    
        number.move();
        if (number.speedY > 5){
            healthNumbers.splice(index,1);
        }
    });
}

function handleExplosionWaves(){
    explosionsWaves.forEach((explosion, index) => {
        explosion.draw();        
        explosion.update();
        if (explosion.alpha < 1){
            explosionsWaves.splice(index,1);
        }
    });
}

function handleLightnings(){
    lightnings.forEach( (lightning, index) => {
        lightning.draw();
        lightning.framesLeft--;
        if (lightning.framesLeft < 0){
            lightnings.splice(index,1);
        }
    });
}

function drawLoops(players){
    fireballs.forEach((fireball) => {
        fireball.draw();
    })

    for (let id in players) {
        players[id].draw();
    }
}