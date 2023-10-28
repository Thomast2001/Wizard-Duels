let explosionSounds = [];
let attackSounds = [];
let lightningSounds = [];
let teleportSounds = [];
let airwaveSounds = [];
let volume = 0.5;

for (let i = 1; i < 4; i++) {
    explosionSounds.push(new Audio(`sounds/Explosion${i}.wav`));
    attackSounds.push(new Audio(`sounds/Attack${i}.wav`));
    lightningSounds.push(new Audio(`sounds/Lightning${i}.wav`));
    teleportSounds.push(new Audio(`sounds/Teleport${i}.wav`));
    airwaveSounds.push(new Audio(`sounds/Airwave${i}.wav`));
}

function changeVolume(newVolume) {
    volume = newVolume;
    playSound(explosionSounds);
}

function playSound(sounds){
    let index = Math.floor(Math.random()*3);
    let sound = sounds[index].cloneNode(true); // Clone the audio node so that it can be played multiple times at once
    sound.volume = volume;
    sound.play();
}