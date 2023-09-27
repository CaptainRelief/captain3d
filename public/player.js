import * as THREE from 'three';


export class Player {
    constructor(color) {
        const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
        const playerMaterial = new THREE.MeshBasicMaterial({ color });
        this.mesh = new THREE.Mesh(playerGeometry, playerMaterial);
        this.mesh.position.set(0, 0, 0);
        this.rotationSpeed = 0.02;
        this.defeated = false; 


        this.health = 100; // Set initial health points

        this.abilities = {
            basicAttack: { damage: 20, cooldown: 1000 }, // Example basic attack
            specialAbility: { damage: 50, cooldown: 5000 }, // Example special ability
            // Define more abilities here
        };
        this.abilityCooldowns = {}; // Track ability cooldowns
    }

    

    moveForward(distance) {
        // Get the forward direction vector based on the player's rotation
        const direction = this.getDirection();
    
        // Calculate the movement vector by multiplying the direction by the distance
        const velocity = direction.clone().multiplyScalar(distance);
    
        // Update the player's position
        this.mesh.position.add(velocity);
    }
    
    moveBackward(distance) {
        // Get the forward direction vector based on the player's rotation
        const direction = this.getDirection();
    
        // To move backward, reverse the direction vector
        const backwardDirection = direction.clone().negate();
    
        // Calculate the movement vector by multiplying the backward direction by the distance
        const velocity = backwardDirection.clone().multiplyScalar(distance);
    
        // Update the player's position
        this.mesh.position.add(velocity);
    }
    
    moveLeft(distance) {
        // Get the forward direction vector based on the player's rotation
        const direction = this.getDirection();
    
        // Calculate the left direction vector by rotating the forward direction 90 degrees to the left
        const leftDirection = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
    
        // Calculate the movement vector by multiplying the left direction by the distance
        const velocity = leftDirection.clone().multiplyScalar(distance);
    
        // Update the player's position
        this.mesh.position.add(velocity);
    }
    
    moveRight(distance) {
        // Get the forward direction vector based on the player's rotation
        const direction = this.getDirection();
    
        // Calculate the right direction vector by rotating the forward direction 90 degrees to the right
        const rightDirection = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    
        // Calculate the movement vector by multiplying the right direction by the distance
        const velocity = rightDirection.clone().multiplyScalar(distance);
    
        // Update the player's position
        this.mesh.position.add(velocity);
    }

    useAbility(abilityName, targetPlayer) {
        const ability = this.abilities[abilityName];

        // Check if the ability is off cooldown
        if (!this.isAbilityOnCooldown(abilityName)) {
            // Perform the ability action (e.g., deal damage)
            targetPlayer.takeDamage(ability.damage);

            // Put the ability on cooldown
            this.setAbilityCooldown(abilityName, ability.cooldown);
        }
    }

    isAbilityOnCooldown(abilityName) {
        return this.abilityCooldowns[abilityName] > Date.now();
    }

    setAbilityCooldown(abilityName, cooldownDuration) {
        this.abilityCooldowns[abilityName] = Date.now() + cooldownDuration;
    }


    rotatePlayer(angle) {
        this.mesh.rotation.y -= angle;
    }

    getPosition() {
        return this.mesh.position;
    }

    setPosition(position) {
        this.mesh.position.copy(position);
    }


    getDirection() {
        // Get the forward direction vector based on the player's rotation
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.mesh.quaternion);
        return direction;
    }

    takeDamage(damage) {
        // Reduce player's health when they take damage
        this.health -= damage;
        
        // Check if the player's health reaches zero or below
        if (this.health <= 0) {
            this.defeated = true; // Mark player as defeated
        }
    }

    isDefeated() {
        return this.defeated;
    }
}
