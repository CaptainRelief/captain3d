import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { Player } from './player.js';
import { Ground } from './ground.js';

const socket = io.connect("wss://192.168.1.34:3000", { // Update with your server's HTTPS URL
  withCredentials: true,
  transportOptions: {
    polling: {
      extraHeaders: {
        "my-custom-header": "abcd"
      }
    }
  }
});

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.mouse = new THREE.Vector2();
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));

        this.players = {}; // Dictionary to store player instances
        this.cameras = {};
        this.controls = {}; 
        this.playerId = null;
        this.activeCamera = null;

        this.initPlayer();
        this.initGround();
        this.initSocketListeners();
        this.initCameras();
        this.initControls();

        this.animate();
    }

    initPlayer() {
        // Create a player instance for the local player
        this.player = new Player(0xffffff, this.cameras.localPlayerCamera);
        this.scene.add(this.player.mesh);
        this.players[this.playerId] = this.player;
        
        // Set up player movement controls
        this.playerSpeed = 0.05;
        this.handleInput();
    }

    initGround() {
        this.ground = new Ground();
        this.scene.add(this.ground.mesh);
    }

    initSocketListeners() {

        // Listen for new player connections
        socket.on('player-connected', (data) => {
            const { playerId, position } = data;
            console.log(`Player ${playerId} connected`);
            // Create a new cube for the connected player
            const color = Math.random() * 0xffffff; // Generate a random color
            const player = new Player(color);
            player.setPosition(position);
            this.players[playerId] = player;
            this.scene.add(player.mesh);
        });

        socket.on('player-id', (playerId) => {
            this.playerId = playerId;
        });

        // Listen for player disconnections
        socket.on('player-disconnected', (playerId) => {
            console.log(`Player ${playerId} disconnected`);
            // Remove the disconnected player's cube from the scene
            if (this.players[playerId]) {
                this.scene.remove(this.players[playerId].mesh);
                delete this.players[playerId];
            }
        });

        // Listen for player movements from other clients
        socket.on('move', (data) => {
            // Update the position of other players
            // Ensure the data includes player identification
            if (data.playerId !== this.playerId) {
                const player = this.players[data.playerId];
                if (player) {
                    player.setPosition(data.position);
                }
            }
        });

        // Listen for combat events from the server
        socket.on('combat', (data) => {
            const { attackerId, targetId, damage } = data;

            // Ensure that both attacker and target exist
            if (this.players[attackerId] && this.players[targetId]) {
                // Deal damage to the target player
                this.players[targetId].takeDamage(damage);

                // Check if the target player is defeated
                if (this.players[targetId].isDefeated()) {
                    // Handle defeated player logic (e.g., respawn, remove from scene)
                }
            }
        });

    }

 

    initCameras() {
        // Create a camera for the local player
        this.createCamera('localPlayerCamera');

        // Set the local player's camera as the active camera initially
        this.setActiveCamera('localPlayerCamera');
    }

    createCamera(cameraName) {
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cameras[cameraName] = camera;

        

    }

    setActiveCamera(cameraName) {
        if (this.cameras[cameraName]) {
            this.activeCamera = this.cameras[cameraName];
        }
    }


    initControls() {
        // Initialize OrbitControls for the local player's camera
        this.controls.localPlayerControls = new OrbitControls(this.cameras.localPlayerCamera, this.renderer.domElement);
        this.controls.localPlayerControls.target.set(0, 0, 0); // Set the target to the center of the scene

        // Disable damping for smoother camera movement (optional)
        this.controls.localPlayerControls.enableDamping = true;
    }


    updatePlayerCamera(camera, targetPlayer) {
        if (targetPlayer && camera) {
            const distanceBehind = 3;
            const yOffset = 2;
    
            const playerPosition = targetPlayer.getPosition();
            const playerDirection = targetPlayer.getDirection();
            const cameraPosition = new THREE.Vector3();
    
            cameraPosition.copy(playerPosition)
                .sub(playerDirection.clone().multiplyScalar(distanceBehind))
                .add(new THREE.Vector3(0, yOffset, 0));
    
            camera.position.copy(cameraPosition);
    
            // Update OrbitControls target to player's position
            this.controls.localPlayerControls.target.copy(playerPosition);
    
            if (this.activeCamera === camera) {
                this.controls.localPlayerControls.update();
            }
        }
    }


    handleInput() {
        document.addEventListener('keydown', (event) => {
            // Handle player movement locally
            switch (event.key) {
                case 'ArrowLeft':
                    this.player.moveLeft(this.playerSpeed);
                    break;
                case 'ArrowRight':
                    this.player.moveRight(this.playerSpeed);
                    break;
                case 'ArrowUp':
                    this.player.moveForward(this.playerSpeed);
                    break;
                case 'ArrowDown':
                    this.player.moveBackward(this.playerSpeed);
                    break;
            }

            socket.emit('move', {
                position: this.player.getPosition(),
            });

        });
    }

    handleCombat(attackerId, targetId, abilityName) {
        // Check if the target is within range (implement your own logic)
        if (this.isInCombatRange(attackerId, targetId)) {
            // Emit combat event to the server
            socket.emit('combat', { attackerId, targetId, abilityName });
        }
    }
    // Check if a player is within combat range (you can define your own range calculation logic)
    isInCombatRange(attackerId, targetId) {
        const attacker = this.players[attackerId];
        const target = this.players[targetId];

        // Implement range calculation here based on player positions
        // Example: return true if they are close enough for combat
        return true;
    }


    onWindowResize() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(newWidth, newHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }


    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.player.rotatePlayer(this.mouse.x * 0.02);
        // Update the active camera view

        this.updatePlayerCamera(this.cameras.localPlayerCamera, this.player);

        this.renderer.render(this.scene, this.activeCamera);
    }
}

// Initialize the game
const game = new Game();