let explosionSounds = [];
let attackSounds = [];
let lightningSounds = [];
let teleportSounds = [];
let airwaveSounds = [];

for (let i = 1; i < 4; i++) {
    explosionSounds.push(new Audio(`sounds/Explosion${i}.wav`));
    attackSounds.push(new Audio(`sounds/Attack${i}.wav`));
    lightningSounds.push(new Audio(`sounds/Lightning${i}.wav`));
    teleportSounds.push(new Audio(`sounds/Teleport${i}.wav`));
    airwaveSounds.push(new Audio(`sounds/Airwave${i}.wav`));
}

function playSound(sounds){
    let index = Math.floor(Math.random()*3);
    sounds[index].cloneNode(true).play();
}