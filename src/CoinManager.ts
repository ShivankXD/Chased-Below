import * as THREE from 'three';
import { Player } from './Player';
import { GameAssets } from './main';

export class CoinManager {
    private scene: THREE.Scene;
    private player: Player;
    private coins: { mesh: THREE.Sprite, baseY: number }[] = [];
    
    private spawnZ: number = -50;
    
    public coinsCollected: number = 0;

    constructor(scene: THREE.Scene, player: Player) {
        this.scene = scene;
        this.player = player;
    }

    public update(_delta: number) {
        // Spawn coins
        if (this.player.mesh.position.z - 150 < this.spawnZ) {
            this.spawnCoinPattern(this.spawnZ);
            this.spawnZ -= 60;
        }

        // Update existing coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            
            // Bobbing around base position (not drifting)
            coin.mesh.position.y = coin.baseY + Math.sin(Date.now() * 0.005 + coin.mesh.position.z) * 0.3;

            // Collision check
            const dz = Math.abs(coin.mesh.position.z - this.player.mesh.position.z);
            const dx = Math.abs(coin.mesh.position.x - this.player.mesh.position.x);
            const dy = Math.abs(coin.mesh.position.y - this.player.mesh.position.y);

            if (dz < 1.5 && dx < 1.5 && dy < 1.5) {
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
        const x = (Math.random() - 0.5) * 16;
        const y = (Math.random() - 0.5) * 16;
        
        for (let i = 0; i < 5; i++) {
            const material = new THREE.SpriteMaterial({
                map: GameAssets.coin,
                color: 0xffffff
            });
            const mesh = new THREE.Sprite(material);
            mesh.scale.set(2.5, 2.5, 1);
            const coinY = y + i * 0.5;
            mesh.position.set(x, coinY, zPos - (i * 3));
            
            this.scene.add(mesh);
            this.coins.push({ mesh, baseY: coinY });
        }
    }

    public reset() {
        this.coins.forEach(c => this.scene.remove(c.mesh));
        this.coins = [];
        this.coinsCollected = 0;
        this.spawnZ = -50;
    }
}
