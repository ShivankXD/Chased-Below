import * as THREE from 'three';
import { Player } from './Player';
import gsap from 'gsap';
import { GameAssets } from './main';

export class Shark {
    public mesh: THREE.Group;
    private player: Player;
    
    // Chase mechanics
    private currentDistance: number = 40;
    private readonly maxDistance: number = 80;
    public readonly catchDistance: number = 3;
    
    private sharkSprite: THREE.Sprite;
    private isJumpscareActive = false;

    constructor(player: Player, scene: THREE.Scene) {
        this.player = player;
        this.mesh = new THREE.Group();

        const material = new THREE.SpriteMaterial({
            map: GameAssets.sharkBack,
            color: 0xffffff
        });

        this.sharkSprite = new THREE.Sprite(material);
        this.sharkSprite.scale.set(8, 8, 1);
        this.mesh.add(this.sharkSprite);

        scene.add(this.mesh);

        this.reset();
    }

    public triggerJumpscare() {
        if (this.isJumpscareActive) return;
        this.isJumpscareActive = true;

        // Change sprite to front-facing
        this.sharkSprite.material.map = GameAssets.sharkFront;
        this.sharkSprite.material.needsUpdate = true;
        
        // Put shark in front of player
        this.mesh.position.z = this.player.mesh.position.z - 50;
        this.mesh.position.x = this.player.mesh.position.x;
        this.mesh.position.y = this.player.mesh.position.y;

        // Charge towards player
        gsap.to(this.mesh.position, {
            z: this.player.mesh.position.z + 10,
            duration: 1.5,
            ease: "power2.in",
            onComplete: () => {
                this.isJumpscareActive = false;
                this.sharkSprite.material.map = GameAssets.sharkBack;
                this.sharkSprite.material.needsUpdate = true;
                this.mesh.position.z = this.player.mesh.position.z + this.currentDistance;
            }
        });
    }

    public update(delta: number) {
        if (this.isJumpscareActive) {
            // During jumpscare, just track player X/Y
            this.mesh.position.x += (this.player.mesh.position.x - this.mesh.position.x) * delta * 5;
            this.mesh.position.y += (this.player.mesh.position.y - this.mesh.position.y) * delta * 5;
            return;
        }

        const optimalSpeed = 30;
        
        if (this.player.speed < optimalSpeed - 2) {
            this.currentDistance -= (optimalSpeed - this.player.speed) * delta * 1.5;
        } else {
            if (this.currentDistance < this.maxDistance) {
                this.currentDistance += delta * 4;
            }
        }

        this.currentDistance = Math.max(this.currentDistance, 0);

        this.mesh.position.z = this.player.mesh.position.z + this.currentDistance;
        this.mesh.position.x += (this.player.mesh.position.x - this.mesh.position.x) * delta * 2;
        this.mesh.position.y = this.player.mesh.position.y;

        // Bobbing
        this.sharkSprite.position.y = Math.sin(Date.now() * 0.01) * 0.5;
        
        // Random jumpscare chance (~0.05% per frame, only when far behind)
        if (Math.random() < 0.0005 && this.currentDistance > 50) {
            this.triggerJumpscare();
        }
    }

    public hasCaughtPlayer(): boolean {
        return !this.isJumpscareActive && this.currentDistance <= this.catchDistance;
    }

    public reset() {
        this.currentDistance = 40;
        this.isJumpscareActive = false;
        if (this.sharkSprite && this.sharkSprite.material) {
            this.sharkSprite.material.map = GameAssets.sharkBack;
            this.sharkSprite.material.needsUpdate = true;
        }
        this.mesh.position.set(0, 0, 40);
    }
}
