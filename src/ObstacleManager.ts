import * as THREE from 'three';
import { Player } from './Player';
import { GameAssets } from './main';

export class ObstacleManager {
    private scene: THREE.Scene;
    private player: Player;
    private obstacles: { mesh: THREE.Mesh }[] = [];
    
    private spawnZ: number = -100;
    private spawnInterval: number = 40; // distance between obstacles

    constructor(scene: THREE.Scene, player: Player) {
        this.scene = scene;
        this.player = player;
    }

    public update(delta: number) {
        // Spawn new obstacles ahead
        if (this.player.mesh.position.z - this.spawnDistance < this.spawnZ) {
            this.spawnObstacle(this.spawnZ);
            this.spawnZ -= this.spawnInterval;
        }

        // Check collisions and remove passed obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];

            // Collision check (simple distance based)
            const dz = Math.abs(obs.mesh.position.z - this.player.mesh.position.z);
            const dx = Math.abs(obs.mesh.position.x - this.player.mesh.position.x);
            const dy = Math.abs(obs.mesh.position.y - this.player.mesh.position.y);

            if (dz < 2 && dx < 2 && dy < 2) {
                this.player.hitObstacle();
                
                // Remove obstacle to prevent multiple hits
                this.scene.remove(obs.mesh);
                this.obstacles.splice(i, 1);
                continue;
            }

            // Remove if far behind
            if (obs.mesh.position.z > this.player.mesh.position.z + 50) {
                this.scene.remove(obs.mesh);
                this.obstacles.splice(i, 1);
            }
        }
    }

    private get spawnDistance() {
        return 200;
    }

    private spawnObstacle(z: number) {
        // Random X and Y within bounds (-10 to 10)
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 20;
        
        // Randomly pick mine or barrel
        const isMine = Math.random() > 0.5;
        const tex = isMine ? GameAssets.mine : GameAssets.barrel;

        const material = new THREE.SpriteMaterial({ 
            map: tex,
            color: 0xffffff
        });
        
        const mesh = new THREE.Sprite(material);
        mesh.scale.set(4, 4, 1);
        mesh.position.set(x, y, z);
        
        this.scene.add(mesh);
        this.obstacles.push({ mesh });
    }

    public reset() {
        this.obstacles.forEach(obs => this.scene.remove(obs.mesh));
        this.obstacles = [];
        this.spawnZ = -100;
    }
}
