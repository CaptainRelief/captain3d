import * as THREE from 'three';

export class Ground {
    constructor() {
        const geometry = new THREE.PlaneGeometry(100, 100); // Adjust size as needed
        const texture = new THREE.TextureLoader().load('ground.png'); // Load ground texture
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10); // Repeat the texture for a tiling effect
        const material = new THREE.MeshBasicMaterial({ map: texture });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    }
}

