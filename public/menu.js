const createLobbyForm = document.querySelector('#createLobbyForm');
const mainMenu = document.querySelector('#main_menu')
const roomTableBody = document.querySelector("#lobby_table");
const lobbyBrowser = document.querySelector("#lobby_browser");
const chooseName = document.querySelector("#chooseName");
const waitingRoom = document.querySelector("#waitingRoom");
const playerList = document.querySelector("#playerList")
const readyButton = document.querySelector("#readyButton");
const disconnectButton = document.querySelector("#disconnectButton");

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

document.querySelector("#closeLobbybrowser").addEventListener("click", () => { openMenu("mainMenu") })

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
  console.log(disconnectButton)
  disconnectButton.style.display = 'none';
  // options.style.display = 'none';

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
      disconnectButton.style.display = 'block';
      break;
    default:
      break;
  }
}


document.querySelector('#playButton').addEventListener('click', () => {
  openMenu("lobbyBrowser");
})

document.querySelector('#chooseNameButton').addEventListener('click', () => {
  playerName = document.querySelector('#nameInput').value;
  openMenu("mainMenu");
})

document.querySelector('#colorButton').addEventListener('click', () => {
  socket.emit("color");
})


createLobbyForm.addEventListener('submit', (e) => { // Creating a lobby
  e.preventDefault(); 

  const roomName = roomNameInput.value;
  const password = passwordInput.value;

  // Send lobby information to the server using Socket.io
  socket.emit('createRoom', { roomName, password, playerName });

  openMenu('waitingRoom');
  // Clear the input fields
  roomNameInput.value = '';
  passwordInput.value = '';
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
          const password = document.createElement('td');

          nameCell.textContent = room.name;
          players.textContent = `${room.playerIDs.length}/4`;
          joinableCell.textContent = !room.gameStarted;
          password.textContent = "No";

          row.appendChild(nameCell);
          row.appendChild(players);
          row.appendChild(joinableCell);
          row.appendChild(password);

          row.classList.add("lobby")
          row.classList.add("nes-pointer")

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

disconnectButton.addEventListener("click", () => {
  socket.emit('leaveLobby');
});

refreshLobbies()


