const express = require('express');
const fs = require('fs');
const cors = require('cors');
const https = require('https');
const socketIO = require('socket.io');
const path = require('path');


const app = express();


// Create HTTPS server

const httpsServer = https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
  }, app);


const io = socketIO(httpsServer, {
    cors: {
        origins: ["https://localhost:3000"],
        
    handlePreflightRequest: (req, res) => {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST",
            "Access-Control-Allow-Headers": "my-custom-header",
            "Access-Control-Allow-Credentials": true
        });
        res.end();
    }}
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io-client/dist'));

// Configure CORS to allow requests from your client-side origin
app.use(cors());

// Store connected players
const players = {};

// Counter for assigning unique player IDs
let playerIdCounter = 0;    


io.on('connection', (socket) => {
    console.log('A user connected');

    // Assign a unique ID to the player
    const playerId = playerIdCounter++;
    players[playerId] = { socket, position: { x: 0, y: 0, z: 0 } };


        // Send existing player positions to the new player
        Object.keys(players).forEach((existingPlayerId) => {
            if (existingPlayerId !== playerId) {
                const position = players[existingPlayerId].position;
                socket.emit('player-connected', { playerId: existingPlayerId, position });
            }
        });
    

     // Broadcast the new player's ID and position to all other clients
     socket.broadcast.emit('player-connected', { playerId, position: { x: 0, y: 0, z: 0 } });

    // Handle player movement synchronization
    socket.on('move', (data) => {
        // Update the player's position on the server
        players[playerId].position = data.position;

        // Broadcast the movement data to all connected clients except the sender
        socket.broadcast.emit('move', { playerId, position: data.position });
    });

    socket.on('combat', (data) => {
        const { attackerId, targetId, abilityName } = data;

        // Check if both players exist and are in combat range
        if (players[attackerId] && players[targetId] && game.isInCombatRange(attackerId, targetId)) {
            // Perform combat action based on ability
            const attacker = players[attackerId];
            const target = players[targetId];
            attacker.useAbility(abilityName, target);

            // Emit the combat event to all clients
            io.emit('combat', { attackerId, targetId, abilityName });
        }
    });



    socket.on('disconnect', () => {
        console.log('A user disconnected');
        
        // Broadcast the disconnection to all other clients
        socket.broadcast.emit('player-disconnected', playerId);

        // Remove the player from the players dictionary
        delete players[playerId];
    });
});

const PORT = process.env.PORT || 3000;

httpsServer.listen(PORT, () => {
    console.log('Visit https://localhost:3000'); // Update with your server's HTTPS URL
});