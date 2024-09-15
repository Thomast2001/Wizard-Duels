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
    });
}

function updateGold(gold) {
    document.querySelector('#gold').innerText = gold;
}

function upgradePurchased(players, playerID, purchased, abilityCooldowns) {
    players[playerID].levels[purchased] += 1;
    if (playerID == socket.id) {
        const updatedLevel = players[playerID].levels[purchased];
        document.querySelector(`#${purchased}Title`).innerText = `${purchased} (${upgrades[purchased].cost[updatedLevel]})`
        document.querySelector(`#${purchased}Level${updatedLevel}`).classList.remove("level-light-black");
        document.querySelector(`#${purchased}Level${updatedLevel}`).classList.add("level-light-green");
        if (purchased != 'Health' && purchased != 'Boots') {
            abilityCooldowns[purchased] = upgrades[purchased].cooldown[updatedLevel];
        }
    }
    if (purchased == 'Health') {
        players[playerID].maxHealth += 20;
        if (playerID == socket.id) {
            document.querySelector('#healthBar').max = players[playerID].maxHealth;
        }
    } else if (purchased == 'Boots') {
        players[playerID].speedTotal += 0.25;
    }
}

function resetShop() {
    shopItems.forEach(item => {
        document.querySelector(`#${item}Title`).innerText = `${item} (${upgrades[item].cost[0]})`; // Reset price of all items in the shop
        for (let i = 1; i < 6; i++) {
            if (!(item == 'Boots' && i > 3)) { // 'Boots' only has 3 levels
                document.querySelector(`#${item}Level${i}`).classList.remove("level-light-green"); // reset all "levelLights" to black
                document.querySelector(`#${item}Level${i}`).classList.add("level-light-black");
            }
        }    
    });
    document.querySelector('#FireballTitle').innerText = `Fireball (${upgrades.Fireball.cost[1]})`; // Fireball starts at level 1
    document.querySelector('#FireballLevel1').classList.remove("level-light-black");
    document.querySelector('#FireballLevel1').classList.add("level-light-green");
    document.querySelector('#gold').innerText = 250; // Reset gold
}