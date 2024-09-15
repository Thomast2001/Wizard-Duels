# Wizard Duels - README

## Introduction
Welcome to Wizard Duels, a real-time multiplayer game. This README serves as a guide to help you understand the game, and how to set it up to play. Wizard Duels is built using vanilla JavaScript and utilizes Socket.IO for real-time communication between players.

## Game Overview
In Wizard Duels players are able to create and join lobbies to play against each other. Each player controls a wizard and can cast spells to attack their opponent, the last one alive wins the round. The goal of the game is to win 5 rounds. Between each round the game features a shop in which players can buy spells and abilities to use in the game. The game also features AI bots with two difficulty levels.

![](https://github.com/Thomast2001/Wizard-Duels/blob/main/gifs/menu.gif)

## Features
- Real-time multiplayer gameplay.
- Intuitive controls for casting spells and maneuvering.
- Server can handle multiple lobbies at once.
- AI bots to play against.

## How to Play
1. **Setup:**
    - Ensure you have Node.js installed on your system.
    - Clone the repository to your local machine.

2. **Installation:**
    - Install the required dependencies by running `npm install`.

3. **Start the Server:**
    - Start the server by running `node app.js`.

4. **Connect to the Game:**
    - Open your web browser and go to `http://localhost:3000` to access Wizard Duels.

## Technologies Used
- Vanilla JavaScript: For game logic and client-side scripting.
- Socket.IO: For real-time communication between clients and the server.
- HTML/CSS: For game interface and styling.
- Node.js: For server-side scripting.

## Credits
The wizard sprites used in this game are based on assets from https://penzilla.itch.io/hooded-protagonist, but with some modifications.