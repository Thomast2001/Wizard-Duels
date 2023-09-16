const createLobbyForm = document.querySelector('#createLobbyForm');
const mainMenu = document.querySelector('#main_menu')
const roomTableBody = document.querySelector("#lobby_table");
const lobbyBrowser = document.querySelector("#lobby_browser");
const chooseName = document.querySelector("#chooseName");

document.querySelector("#refreshButton").addEventListener("click", refreshLobbies);
let playerName = "player99";


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





createLobbyForm.addEventListener('submit', (e) => { // Creating a lobby
  e.preventDefault(); 

  const roomName = roomNameInput.value;
  const password = passwordInput.value;

  // Send lobby information to the server using Socket.io
  socket.emit('createRoom', { roomName, password, playerName });

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
          })
          
          roomTableBody.appendChild(row);
          
      });
    });
}


refreshLobbies()


