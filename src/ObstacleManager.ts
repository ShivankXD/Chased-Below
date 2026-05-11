import * as THREE from 'three';
import { Player } from './Player';

export class ObstacleManager {
    private scene: THREE.Scene;
    private player: Player;
    private obstacles: { mesh: THREE.Mesh, lane: number }[] = [];
    
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
            // Player is jumping if y > 1.5, obstacles are height 1 at y=1
            const dz = Math.abs(obs.mesh.position.z - this.player.mesh.position.z);
            if (dz < 2 && obs.lane === this.player.lane) {
                // If player is not high enough to clear it
                if (this.player.mesh.position.y < 2) {
                    this.player.hitObstacle();
                    
                    // Remove obstacle to prevent multiple hits
                    this.scene.remove(obs.mesh);
                    this.obstacles.splice(i, 1);
                    continue;
                }
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
        // Random lane: -1, 0, or 1
        const lane = Math.floor(Math.random() * 3) - 1;
        
        // Crate or broken pipe obstacle
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff5500,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(lane * this.player.laneWidth, 1, z);
        
        this.scene.add(mesh);
        this.obstacles.push({ mesh, lane });
    }

    public reset() {
        this.obstacles.forEach(obs => this.scene.remove(obs.mesh));
        this.obstacles = [];
        this.spawnZ = -100;
    }
}
