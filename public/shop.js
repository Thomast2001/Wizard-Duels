const shopItems = ['Fireball', 'Airwave', 'Teleport', 'Lightning', 'Health', 'Boots'];

let upgrades;
fetch('/upgrades.json')
    .then(response => response.json())
    .then(data => {
        upgrades = data;
    })
    .catch(error => {
        console.error('Error fetching JSON data:', error);
    });


for (let i = 0; i < shopItems.length; i++) {
    let item = document.querySelector(`#${shopItems[i]}Shop`)
    item.addEventListener('click', () => {
        socket.emit('shop', shopItems[i])
        console.log(shopItems[i])
    });
}

function updateGold(gold) {
    document.querySelector('#gold').innerText = gold;
}

function upgradePurchased(players, playerID, purchased) {
    players[playerID].levels[purchased] += 1;
    if (playerID == socket.id) {
        const updatedLevel = players[playerID].levels[purchased];
        console.log(players[playerID].levels, purchased)
        //console.log(upgrades[purchased].cost, updatedLevel);
        //console.log(upgrades[purchased].cost[updatedLevel]);
        document.querySelector(`#${purchased}Title`).innerText = `${purchased} (${upgrades[purchased].cost[updatedLevel]})`
        console.log(`#${purchased}Level${updatedLevel}`)
        document.querySelector(`#${purchased}Level${updatedLevel}`).classList.remove("level-light-black");
        document.querySelector(`#${purchased}Level${updatedLevel}`).classList.add("level-light-green");
    }
}