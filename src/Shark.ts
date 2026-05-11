import * as THREE from 'three';
import { Player } from './Player';
import gsap from 'gsap';

export class Shark {
    public mesh: THREE.Group;
    private player: Player;
    
    // Chase mechanics
    private currentDistance: number = 30; // Starts 30 units behind
    public readonly catchDistance: number = 3;
    
    private sharkBody: THREE.Mesh;

    constructor(player: Player, scene: THREE.Scene) {
        this.player = player;
        this.mesh = new THREE.Group();

        // Placeholder Shark (a large, menacing cylinder/cone hybrid)
        const geometry = new THREE.CylinderGeometry(0.1, 2, 8, 12);
        geometry.rotateX(-Math.PI / 2); // Point forward
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.5,
            metalness: 0.1,
            emissive: 0x220000,
            emissiveIntensity: 0.5
        });

        this.sharkBody = new THREE.Mesh(geometry, material);
        this.mesh.add(this.sharkBody);

        // Add some glowing red eyes
        const eyeGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.8, 0.5, -3);
        this.mesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.8, 0.5, -3);
        this.mesh.add(rightEye);

        scene.add(this.mesh);

        this.reset();
    }

    public update(delta: number) {
        // The shark always tries to catch up. 
        // If player speed is 20, shark base speed is maybe 18, but it gets bursts?
        // Actually, let's make it simpler: shark closes in if player speed drops below a threshold.
        // For now, player speed is constant 20. Let's say optimal speed is 20.
        const optimalSpeed = 20;
        
        if (this.player.speed < optimalSpeed) {
            // Player is slow, shark catches up
            this.currentDistance -= (optimalSpeed - this.player.speed) * delta * 2;
        } else {
            // Player is fast, shark falls back slightly to base distance
            if (this.currentDistance < 30) {
                this.currentDistance += delta * 2;
            }
        }

        // Clamp distance
        this.currentDistance = Math.max(this.currentDistance, 0);

        // Update Position
        // Follow player's Z minus currentDistance
        this.mesh.position.z = this.player.mesh.position.z + this.currentDistance;
        
        // Slowly align with player's X (lane)
        this.mesh.position.x += (this.player.mesh.position.x - this.mesh.position.x) * delta * 2;
        this.mesh.position.y = this.player.mesh.position.y;

        // Jaw chomp animation / bobbing
        this.sharkBody.position.y = Math.sin(Date.now() * 0.01) * 0.5;
    }

    public hasCaughtPlayer(): boolean {
        return this.currentDistance <= this.catchDistance;
    }

    public reset() {
        this.currentDistance = 30;
        this.mesh.position.set(0, 1, 30);
    }
}
