import * as THREE from 'three';
import { Player } from './Player';

export class CoinManager {
    private scene: THREE.Scene;
    private player: Player;
    private coins: { mesh: THREE.Mesh }[] = [];
    
    private spawnZ: number = -50;
    
    public coinsCollected: number = 0;

    // Shared geometry and material for performance
    private coinGeometry: THREE.CylinderGeometry;
    private coinMaterial: THREE.MeshStandardMaterial;

    constructor(scene: THREE.Scene, player: Player) {
        this.scene = scene;
        this.player = player;

        // Thin cylinder (coin)
        this.coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        this.coinGeometry.rotateX(Math.PI / 2); // Stand upright

        this.coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xaa8800,
            emissiveIntensity: 0.5,
            metalness: 1,
            roughness: 0.2
        });
    }

    public update(delta: number) {
        // Spawn coins
        if (this.player.mesh.position.z - 150 < this.spawnZ) {
            this.spawnCoinPattern(this.spawnZ);
            this.spawnZ -= 60; // Distance between patterns
        }

        // Update existing coins (rotation and collision)
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            
            // Rotate coin
            coin.mesh.rotation.y += delta * 2;

            // Collision check
            const dz = Math.abs(coin.mesh.position.z - this.player.mesh.position.z);
            const dx = Math.abs(coin.mesh.position.x - this.player.mesh.position.x);
            const dy = Math.abs(coin.mesh.position.y - this.player.mesh.position.y);

            if (dz < 1.5 && dx < 1.5 && dy < 1.5) {
                // Collected
                this.coinsCollected++;
                this.scene.remove(coin.mesh);
                this.coins.splice(i, 1);
                continue;
            }

            // Remove if far behind
            if (coin.mesh.position.z > this.player.mesh.position.z + 20) {
                this.scene.remove(coin.mesh);
                this.coins.splice(i, 1);
            }
        }
    }

    private spawnCoinPattern(zPos: number) {
        // Random X and Y
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 20;
        
        // Spawn a line of 5 coins
        for (let i = 0; i < 5; i++) {
            const mesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
            mesh.position.set(x, y, zPos - (i * 2)); // spaced by 2 units
            
            this.scene.add(mesh);
            this.coins.push({ mesh });
        }
    }

    public reset() {
        this.coins.forEach(c => this.scene.remove(c.mesh));
        this.coins = [];
        this.coinsCollected = 0;
        this.spawnZ = -50;
    }
}
