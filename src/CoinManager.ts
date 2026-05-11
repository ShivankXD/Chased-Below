import * as THREE from 'three';
import { Player } from './Player';
import { GameAssets } from './main';

export class CoinManager {
    private scene: THREE.Scene;
    private player: Player;
    private coins: { mesh: THREE.Sprite }[] = [];
    
    private spawnZ: number = -50;
    
    public coinsCollected: number = 0;

    private coinMaterial: THREE.SpriteMaterial;

    constructor(scene: THREE.Scene, player: Player) {
        this.scene = scene;
        this.player = player;

        this.coinMaterial = new THREE.SpriteMaterial({
            map: GameAssets.coin,
            color: 0xffffff
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
            
            // Simple bobbing instead of 3D rotation for sprite
            coin.mesh.position.y += Math.sin(Date.now() * 0.01 + coin.mesh.position.z) * 0.05;

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
            const mesh = new THREE.Sprite(this.coinMaterial);
            mesh.scale.set(2, 2, 1);
            mesh.position.set(x, y, zPos - (i * 3)); // spaced by 3 units
            
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
