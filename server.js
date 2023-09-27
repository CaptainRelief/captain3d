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
        origin: 'https://87.92.128.137:3000', // Replace with your frontend's URL
        methods: ["GET", "POST"],
        credentials: true,
        transports: ["websocket", "polling"],
    }
});

app.use(express.static(path.join(__dirname, 'public')));


// Configure CORS to allow requests from your client-side origin
const corsOptions = {
    origin: 'https://87.92.128.137:3000', // Replace with your Nginx server's domain or IP
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable credentials (cookies, authorization headers, etc.)
    optionsSuccessStatus: 204, // Sets the status code for successful OPTIONS requests
};


app.use(cors(corsOptions));

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