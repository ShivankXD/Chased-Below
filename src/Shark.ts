import * as THREE from 'three';
import { Player } from './Player';
import gsap from 'gsap';

export class Shark {
    public mesh: THREE.Group;
    private player: Player;
    
    // Chase mechanics
    private currentDistance: number = 40; // Starts 40 units behind
    private readonly maxDistance: number = 80; // Out of camera view
    public readonly catchDistance: number = 3;
    
    private sharkBody: THREE.Mesh;

    constructor(player: Player, scene: THREE.Scene) {
        this.player = player;
        this.mesh = new THREE.Group();

        // Cartoon Shark Body
        const geometry = new THREE.CylinderGeometry(0.2, 3, 10, 16);
        geometry.rotateX(-Math.PI / 2); // Point forward
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x445566, // bluish grey
            roughness: 0.6,
            metalness: 0.2
        });

        this.sharkBody = new THREE.Mesh(geometry, material);
        
        // Dorsal Fin
        const dorsalGeo = new THREE.ConeGeometry(1, 2, 4);
        const dorsal = new THREE.Mesh(dorsalGeo, material);
        dorsal.position.set(0, 3, -1);
        this.sharkBody.add(dorsal);

        // Tail
        const tailGeo = new THREE.ConeGeometry(1.5, 3, 4);
        tailGeo.rotateX(-Math.PI / 2);
        const tail = new THREE.Mesh(tailGeo, material);
        tail.position.set(0, 0, 6);
        this.sharkBody.add(tail);

        this.mesh.add(this.sharkBody);

        // Add some cartoonish eyes
        const eyeGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-1.2, 1, -4);
        const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), pupilMat);
        leftPupil.position.set(-0.1, 0, -0.4);
        leftEye.add(leftPupil);
        this.mesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(1.2, 1, -4);
        const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), pupilMat);
        rightPupil.position.set(0.1, 0, -0.4);
        rightEye.add(rightPupil);
        this.mesh.add(rightEye);

        scene.add(this.mesh);

        this.reset();
    }

    public update(delta: number) {
        // The shark always tries to catch up. 
        // If player speed is 20, shark base speed is maybe 18, but it gets bursts?
        // Actually, let's make it simpler: shark closes in if player speed drops below a threshold.
        // For now, player speed is constant 20. Let's say optimal speed is 20.
        const optimalSpeed = 30;
        
        if (this.player.speed < optimalSpeed - 2) {
            // Player is slow, shark catches up VERY fast
            this.currentDistance -= (optimalSpeed - this.player.speed) * delta * 1.5;
        } else {
            // Player is fast, shark falls back
            if (this.currentDistance < this.maxDistance) {
                this.currentDistance += delta * 4; // slowly falls behind
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
        this.currentDistance = 40;
        this.mesh.position.set(0, 0, 40);
    }
}
