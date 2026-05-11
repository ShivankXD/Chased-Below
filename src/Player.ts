import * as THREE from 'three';
import gsap from 'gsap';
import { GameAssets } from './main';

export class Player {
    public mesh: THREE.Group;
    public speed: number = 30; // Current units per second (increased for excitement)
    public optimalSpeed: number = 30; // Target units per second
    
    public controlEnabled: boolean = true;
    public isDead: boolean = false;
    private fishSprite: THREE.Sprite;

    // Movement state
    private keys: { [key: string]: boolean } = {};
    private moveSpeedXY: number = 20; // units per sec
    private bounds = { x: 12, yMax: 12, yMin: -12 }; // Movement bounds in the pipe/water

    constructor() {
        this.mesh = new THREE.Group();
        
        // Use the generated 2.5D sprite
        const material = new THREE.SpriteMaterial({ 
            map: GameAssets.fish,
            color: 0xffffff,
        });
        
        this.fishSprite = new THREE.Sprite(material);
        this.fishSprite.scale.set(1.5, 1.5, 1); // Much smaller size so it doesn't block camera
        this.mesh.add(this.fishSprite);

        this.mesh.position.y = 0;

        this.setupControls();
    }

    private setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    public update(delta: number) {
        if (this.isDead) return;

        // Recover speed over time if slowed down
        if (this.speed < this.optimalSpeed) {
            this.speed += delta * 5; 
            if (this.speed > this.optimalSpeed) this.speed = this.optimalSpeed;
        }

        // Forward movement
        this.mesh.position.z -= this.speed * delta;
        
        if (this.controlEnabled) {
            let dx = 0;
            let dy = 0;

            if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
            if (this.keys['d'] || this.keys['arrowright']) dx += 1;
            if (this.keys['w'] || this.keys['arrowdown']) dy -= 1; // W = depth/down
            if (this.keys['s'] || this.keys['arrowup']) dy += 1; // S = up

            if (dx !== 0 || dy !== 0) {
                // Normalize
                const len = Math.sqrt(dx*dx + dy*dy);
                dx /= len;
                dy /= len;

                this.mesh.position.x += dx * this.moveSpeedXY * delta;
                this.mesh.position.y += dy * this.moveSpeedXY * delta;

                // Clamp to bounds
                this.mesh.position.x = Math.max(-this.bounds.x, Math.min(this.bounds.x, this.mesh.position.x));
                this.mesh.position.y = Math.max(this.bounds.yMin, Math.min(this.bounds.yMax, this.mesh.position.y));
                
                // Animate tilt using material rotation since it's a sprite
                // Sprite rotation is 2D, so we can only tilt left/right
                gsap.to(this.fishSprite.material, {
                    rotation: dx * Math.PI / 8,
                    duration: 0.2,
                    overwrite: "auto"
                });
            } else {
                // Return to normal rotation
                gsap.to(this.fishSprite.material, {
                    rotation: 0,
                    duration: 0.3,
                    overwrite: "auto"
                });
                
                // Idle bobbing
                this.fishSprite.position.y = Math.sin(Date.now() * 0.005) * 0.2;
            }
        }
    }

    public hitObstacle() {
        if (!this.controlEnabled) return;
        
        // Drastically reduce speed to let shark catch up
        this.speed = 10;
        
        // Screen shake effect on player
        gsap.to(this.mesh.position, {
            x: this.mesh.position.x + (Math.random() - 0.5),
            y: this.mesh.position.y + (Math.random() - 0.5),
            duration: 0.1,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                // Clamp again just in case
                this.mesh.position.x = Math.max(-this.bounds.x, Math.min(this.bounds.x, this.mesh.position.x));
                this.mesh.position.y = Math.max(this.bounds.yMin, Math.min(this.bounds.yMax, this.mesh.position.y));
            }
        });
    }

    public die() {
        this.isDead = true;
    }

    public reset() {
        this.isDead = false;
        this.controlEnabled = true;
        this.mesh.position.set(0, 0, 0);
        this.speed = this.optimalSpeed;
        this.keys = {};
        this.fishSprite.material.rotation = 0;
    }
}
