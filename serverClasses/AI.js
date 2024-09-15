const Player = require('./player');
const gameFunctions = require('./../gameFunctions.js');
const upgrades = require('./../public/upgrades.json');
const roomFunctions = require('./../roomFunctions.js');
const A = require('./abilities.js') 

class AI extends Player {
    constructor(color, name, id, difficulty, room) {
        super(color, name, id);
        this.difficulty = difficulty;
        this.moveCooldown = 0; // cooldown decrements every tick (every 100ms)
        this.isAI = true;
        this.room = room;
        this.enemyTarget = null;
        this.spread = 100;
    }

    randomMove(io) {
        this.targetPosX = Math.random() * 1250 + 270;
        this.targetPosY = Math.random() * 580 + 130;
        this.calcSpeed(this.targetPosX, this.targetPosY);
        io.to(this.room).emit("move", {'id': this.id, 'x': this.targetPosX, 'y': this.targetPosY});
    }

    tick(io, players, fireballs, playerIDs) {
        if (this.moveCooldown <= 0) {
            this.randomMove(io);
            this.moveCooldown = Math.floor(Math.random() * 10 + 5);
        }
        this.moveCooldown -= 1;
        if (!this.onCooldown['fireball']) {
            console.log('fireball');
            if (this.difficulty == 0) {
                this.fireball(io, fireballs, players, playerIDs);
            } else {
                this.unfairFireball(io, fireballs, players, playerIDs)
            }
        }

        if (!this.onCooldown['airwave'] && this.levels.Airwave > 0 && this.enemyTarget) {
            this.airwave(io, players, playerIDs);
        }

        if (!this.onCooldown['teleport'] && this.levels.Teleport > 0
                    && !this.onCooldown['airwave'] && this.levels.Airwave > 0 && this.enemyTarget) {
            this.teleportWaveCombo(io);
        }

        if (!this.onCooldown['lightning'] && this.levels.Lightning > 0) {
            this.lightning(io, players, playerIDs);
        }

        if (!this.onCooldown['teleport'] && this.levels.Teleport > 0) {
            this.teleport(io, fireballs);
        }
    }

    fireball(io, fireballs, players, playerIDs) {
        const target = this.getNearestEnemy(players, playerIDs);
        if (target) {
            const targetCords = {
                'x': target.x + Math.random()*this.spread-this.spread/2, 
                'y': target.y + Math.random()*this.spread-this.spread/2
            };
            if (Math.random() < 0.5) { // 50% change to target the direction the player is running
                targetCords.x += target.speedX * 50;
                targetCords.y += target.speedY * 50;
            }
            console.log('target cords', targetCords);
            gameFunctions.fireball(this, this.id, io, this.room, targetCords, fireballs, upgrades);
        }
    }

    unfairFireball(io, fireballs, players, playerIDs) {
        const target = this.getNearestEnemy(players, playerIDs);
        for (let i = 0; i < 3; i++) { // fire 3 fireballs at a time
            if (target) {
                const targetCords = {
                    'x': target.x + Math.random()*this.spread*2.5-this.spread, 
                    'y': target.y + Math.random()*this.spread*2.5-this.spread
                };
                if (Math.random() < 0.5) { 
                    targetCords.x += target.speedX * 50;
                    targetCords.y += target.speedY * 50;
                }
                console.log('target cords', targetCords);
                
                const fireballLevel = this.levels.Fireball;
                fireballs[this.room].push(new A.Fireball(this.x, this.y, 
                            targetCords.x, targetCords.y, this.id, upgrades.Fireball.speed[fireballLevel], upgrades.Fireball.damage[fireballLevel]));
                io.to(this.room).emit('fireball', {'x': this.x, 'y': this.y,
                                'targetPosX': targetCords.x, 'targetPosY':targetCords.y, 'playerID': this.id})
            }
        }
        this.cooldown('fireball', 1200);
    }

    teleportWaveCombo(io) {
        const distanceToTarget = Math.sqrt(Math.pow(this.x - this.enemyTarget.x, 2) + Math.pow(this.y - this.enemyTarget.y, 2));
        if (distanceToTarget < upgrades.Teleport.range[this.levels.Teleport]-50) {
            const arenaCenter = {'x': 760, 'y': 420};
            let teleportPos = {'x': Math.floor(Math.random()) * 75, 'y': Math.random(Math.random()) * 75};
            if (this.enemyTarget.x > arenaCenter.x) {
                teleportPos.x = teleportPos.x * -1;
            }
            if (this.enemyTarget.y > arenaCenter.y) {
                teleportPos.y = teleportPos.y * -1;
            }
            teleportPos.x += this.enemyTarget.x;
            teleportPos.y += this.enemyTarget.y;
            gameFunctions.teleport(this, this.id, io, this.room, teleportPos, upgrades);
        }
    }

    airwave(io, players, playerIDs) {
        const distanceToTarget = Math.sqrt(Math.pow(this.x - this.enemyTarget.x, 2) + Math.pow(this.y - this.enemyTarget.y, 2));
        if (distanceToTarget < 90) {
            gameFunctions.airwave(this.id, io, this.room, players, upgrades, playerIDs);
        }
    }

    teleport(io, fireballs) {
        if (gameFunctions.checkPlayerOutsideArena(this)) {
            fireballs[this.room].forEach(fireball => {
                if (fireball.playerID != this.id && fireball.x > this.x - 50 && fireball.x < this.x + 50
                    && fireball.y > this.y - 50 && fireball.y < this.y + 50) { //check if fireball is close to player
                    const teleportPos = {'x': Math.random() * 1250 + 270, 'y': Math.random() * 580 + 130};
                    gameFunctions.teleport(this, this.id, io, this.room, teleportPos, upgrades);
                }
            })
            if (Math.random() < 0.02) {
                const teleportPos = {'x': Math.random() * 1250 + 270, 'y': Math.random() * 580 + 130};
                gameFunctions.teleport(this, this.id, io, this.room, teleportPos, upgrades);
            }
        }
    }

    getNearestEnemy(players, playerIDs) {
        let nearestPlayer = null;
        let nearestDistance = 1000000;
        playerIDs.forEach(id => {
            if (id !== this.id && players[id].health > 0) {
                const enemy = players[id];
                const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
                if (distance < nearestDistance) {
                    nearestPlayer = players[id];
                    nearestDistance = distance;
                }
            }
        })
    this.enemyTarget = nearestPlayer;
    return nearestPlayer;
    }

    lightning(io, players, playerIDs) {
        if (Math.random() < 0.01) {
            if (this.enemyTarget) {
                const playerHit = { 'playerHit': this.enemyTarget.id }
                gameFunctions.lightning(this, io, this.room, players, upgrades, playerHit);
            }
        }
        playerIDs.forEach(id => {
            if (id != this.id && players[id].health > 0 
                        && gameFunctions.checkPlayerOutsideArena(players[id]) && Math.random() < 0.05) {
                const playerHit = { 'playerHit': id }
                gameFunctions.lightning(this, io, this.room, players, upgrades, playerHit);
            }
        })
    }


    makePurchases(io) {
        let shopping = true;
        while(shopping) {
            const purchase = Math.floor(Math.random() * 5);
            if (this.gold >= upgrades.Fireball.cost[this.levels.Fireball] && purchase === 0) {
                roomFunctions.purchase(io, this, this.id, upgrades, 'Fireball', this.room);
            } else if (this.gold >= upgrades.Teleport.cost[this.levels.Teleport] && purchase === 1) {
                roomFunctions.purchase(io, this, this.id, upgrades, 'Teleport', this.room);
            } else if (this.gold >= upgrades.Airwave.cost[this.levels.Airwave] && purchase === 2) {
                roomFunctions.purchase(io, this, this.id, upgrades, 'Airwave', this.room);
            } else if (this.gold >= upgrades.Lightning.cost[this.levels.Lightning] && purchase === 3) {
                roomFunctions.purchase(io, this, this.id, upgrades, 'Lightning', this.room);
            } else if (this.gold >= upgrades.Health.cost[this.levels.Health] && purchase === 4) {
                roomFunctions.purchase(io, this, this.id, upgrades, 'Health', this.room);
            } else if (this.gold >= upgrades.Boots.cost[this.levels.Boots] && purchase === 5) {
                roomFunctions.purchase(io, this, this.id, upgrades, 'Boots', this.room);
            } else {
                shopping = false;
            }
        }
    }
}


module.exports = AI