const createLobbyForm = document.querySelector('#createLobbyForm');
const mainMenu = document.querySelector('#main_menu')
const roomTableBody = document.querySelector("#lobby_table");
const lobbyBrowser = document.querySelector("#lobby_browser");
const chooseName = document.querySelector("#chooseName");
const waitingRoom = document.querySelector("#waitingRoom");
const playerList = document.querySelector("#playerList")
const readyButton = document.querySelector("#readyButton");
const disconnectButton = document.querySelector("#disconnectButton");
const leaveGameDiv = document.querySelector("#leaveGameDiv")
const errorPopupDiv = document.querySelector("#errorPopup");
const options = document.querySelector("#options")

readyButton.addEventListener("click", () => {
  if(players[socket.id].ready){
    socket.emit("unready");
    readyButton.classList.remove("is-error");
    readyButton.textContent = "Ready up!";
    players[socket.id].ready = false;
  } else {
    socket.emit("ready");
    readyButton.classList.add("is-error");
    readyButton.textContent = "Unready";
    players[socket.id].ready = true;
  }
})

document.querySelector("#refreshButton").addEventListener("click", refreshLobbies);


document.body.addEventListener('keydown', event => {
  if (event.key == "Escape") {
    let menu = document.querySelector("#game_menu");
    if (menu.style.display === "none") {
        menu.style.display = "block";
      } else {
        menu.style.display = "none";
      }
    }
})

function openMenu(menu){
  mainMenu.style.display = 'none';
  lobbyBrowser.style.display = 'none';
  chooseName.style.display = 'none';
  waitingRoom.style.display = 'none';
  leaveGameDiv.style.display = 'none';
  errorPopupDiv.style.display = 'none';
  options.style.display = 'none';

  switch (menu) {
    case "mainMenu":
      mainMenu.style.display = 'flex';
      break;
    case "lobbyBrowser":
      lobbyBrowser.style.display = 'flex';
      break;
    case "chooseName":
      chooseName.style.display = 'flex';
      break;
    case "waitingRoom":
      waitingRoom.style.display = 'flex';
      shop.style.display = 'flex';
      break;
    case "errorPopup":
      errorPopupDiv.style.display = 'block';
      break;
    case "options":
      options.style.display = 'block';
      break;
    default:
      break;
    }
  }
  
  
document.querySelector('#chooseName').addEventListener('submit', (e) => {
  e.preventDefault(); 
  console.log(e)
  playerName = document.querySelector('#nameInput').value;
  openMenu("mainMenu");
})

document.querySelector('#playButton').addEventListener('click', () => {
  openMenu("lobbyBrowser");
  hideGameTitle();
})

document.querySelector('#optionsButton').addEventListener('click', () => {
  openMenu("options");
})

document.querySelector('#colorButton').addEventListener('click', () => {
  socket.emit("color");
})

createLobbyForm.addEventListener('submit', (e) => { // Creating a lobby
  e.preventDefault(); 

  const roomName = roomNameInput.value;

  // Send lobby information to the server using Socket.io
  socket.emit('createRoom', { roomName, playerName });

  openMenu('waitingRoom');
  // Clear the input field
  roomNameInput.value = '';
});


function refreshLobbies() {
    fetch('/rooms')
      .then(response => response.json())
      .then(data => {
        roomTableBody.innerHTML = '';

        console.log(data)
        data.forEach(room => {
          const row = document.createElement('tr');
          const nameCell = document.createElement('td');
          const players = document.createElement('td');
          const joinableCell = document.createElement('td');

          nameCell.textContent = room.name;
          players.textContent = `${room.playerIDs.length}/4`;
          joinableCell.textContent = room.gameStarted ? "No":"Yes";

          row.appendChild(nameCell);
          row.appendChild(players);
          row.appendChild(joinableCell);

          row.classList.add("lobby")
          row.classList.add("nes-pointer")

          if (room.gameStarted){
            row.style.color = "rgba(255,0,0,0.7)"
          }

          row.addEventListener('click', () => { // Joining a lobby once clicked
            socket.emit('joinRoom', { room: room.name, playerName: playerName });
            openMenu('waitingRoom');
          })
          
          roomTableBody.appendChild(row);
          
      });
    });
}

function addPlayerToList(playerID, color, name) {
    const player = document.createElement('li');
    const playerName = document.createElement('h1');
    const playerImage = document.createElement('img');

    player.setAttribute("id", playerID)
    player.classList.add("player-li");
    playerName.classList.add("player-name");
    playerImage.classList.add("player-image");

    playerImage.src = "playerIcons/" + color + "PlayerImg.png";
    playerName.textContent = name

    player.appendChild(playerName);
    player.appendChild(playerImage);

    playerList.appendChild(player);
}

function changePlayerImg(id, color){
  console.log()
  player = document.getElementById(id);
  playerIcon = player.querySelector('img');
  playerIcon.src = "playerIcons/" + color + "PlayerImg.png";
}

function errorPopup(errorMessage) {
  openMenu("errorPopup");
  document.querySelector("#errorMessage").textContent = errorMessage;
}

document.querySelector("#closePopup").addEventListener("click", () => {
  openMenu("lobbyBrowser");
})

document.querySelector("#closeOptions").addEventListener("click", () => { openMenu("mainMenu") })
document.querySelector("#changeName").addEventListener("click", () => { openMenu("chooseName") })
document.querySelector("#volume").addEventListener("change", (e) => { changeVolume(e.target.value/100) })

document.querySelector("#closeLobbybrowser").addEventListener("click", () => { 
  openMenu("mainMenu") 
  showGameTitle();
})

document.querySelector("#leaveCloseButton").addEventListener("click", () => {
  leaveGameDiv.style.display = "flex";
});

document.querySelector("#disconnectCancelButton").addEventListener("click", () => {
  leaveGameDiv.style.display = "none";
});

disconnectButton.addEventListener("click", () => {
  socket.emit('leaveLobby');
  reset();
  resetShop();
  openMenu('lobbyBrowser')
});

function reset() {
  gamePlaying = false;
  players = {};
  playerList.innerHTML = "" // Clear the list of players in the waiting room
  document.querySelector("#hud").style.display = "none"
}

refreshLobbies()
