const canvas = document.getElementById("game_canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth
canvas.height = window.innerHeight
let socket = io();


let mouse = {
    "x": undefined,
    "y": undefined
};

canvas.addEventListener("resize", () =>{
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight  
});

ctx.beginPath();
ctx.fillStyle = "red";
ctx.fillRect(50,50,50,50);
ctx.fill();

// class player{
//     constructor(color){
//         this.y = 200
//         this.x = 200; // b = y - ax
//         this.health = 100;
//         this.color = color
//         this.speedTotal = 1;
//         this.speedX = 5;
//         this.speedY = 5;
//         this.targetPosX = undefined;
//         this.targetPosY = undefined;
//         this.knockbackX = 0;
//         this.knockbackY = 0;
//     }

//     calcSpeed(mouseX, mouseY) {
//         this.targetPosX = mouseX;
//         this.targetPosY = mouseY;
//         let xDiff = mouseX - this.x;
//         let yDiff = mouseY - this.y;

//         let hyp = Math.hypot(xDiff, yDiff)

//         this.speedX = xDiff / hyp * this.speedTotal
//         this.speedY = yDiff / hyp * this.speedTotal
//     }

//     move() {
//         if (this.x < this.targetPosX + Math.abs(this.speedX) && this.x > this.targetPosX - Math.abs(this.speedX)) {
//             this.speedX = 0;
//             this.speedY = 0;
//         }

//         this.x += this.speedX;
//         this.y += this.speedY;
        
//     }

//     draw() {
//         ctx.fillStyle = this.color;
//         ctx.beginPath();
//         ctx.arc(this.x, this.y, 20, 0, 2 * Math.PI);
//         ctx.fill();
//     }
// }

function handlePlayers(players){
    for (let id in players) {
        players[id].draw();
    }
}

let players = {};


handlePlayers(players);

canvas.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "w":
            players[socket.id].y -= 5
            break;
        case "a":
            players[socket.id].x -= 5
            break;
        case "s":
            players[socket.id].y += 5
            break;
        case "d":
            players[socket.id].x += 5
            break;
        default:
            console.log("somekey");
            break;
    }
});

canvas.addEventListener("click", (event) => {
    players[socket.id].calcSpeed(event.x, event.y);
    console.log(socket.id);
    socket.emit("moveClick", {'x': event.x, 'y': event.y})
})

socket.on("newPlayer", (newPlayer) => {
    players[newPlayer.id] = new Player(newPlayer.color)
})

socket.on("playerDisconnect", (playerId) => {
    delete players[playerId];
})

socket.on("updatePlayers", (updatedPlayers) => {
    for (let playerId in players) {
        if (playerId == socket.id){
            console.log("Calculate corret pos")
        } else{
            players[playerId].x = updatedPlayers[playerId].x;
            players[playerId].y = updatedPlayers[playerId].y;
        }
    }
})

setInterval(() => {
    // console.log(players[socket.id])
    players[socket.id].move();
    console.log(players)
}, 15);

function animate(){
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    handlePlayers(players);
    requestAnimationFrame(animate);
}
animate()