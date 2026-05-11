import * as THREE from 'three';
import gsap from 'gsap';

export class Player {
    public mesh: THREE.Group;
    public speed: number = 20; // Current units per second
    public optimalSpeed: number = 20; // Target units per second
    public lane: number = 0; // -1 (left), 0 (center), 1 (right)
    public laneWidth: number = 4;
    
    private fishMesh: THREE.Mesh;
    private isDead: boolean = false;

    constructor() {
        this.mesh = new THREE.Group();
        
        // Placeholder fish (a sleek elongated shape)
        const geometry = new THREE.ConeGeometry(0.5, 2, 8);
        geometry.rotateX(Math.PI / 2); // Point forward
        
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00f3ff,
            emissive: 0x0044ff,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.8
        });
        
        this.fishMesh = new THREE.Mesh(geometry, material);
        this.mesh.add(this.fishMesh);

        // Position slightly above ground
        this.mesh.position.y = 1;

        this.setupControls();
    }

    private setupControls() {
        window.addEventListener('keydown', (e) => {
            if (this.isDead) return;

            if (e.key === 'ArrowLeft' || e.key === 'a') {
                this.switchLane(-1);
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                this.switchLane(1);
            } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
                this.jump();
            }
        });
    }

    private switchLane(direction: number) {
        const newLane = this.lane + direction;
        if (newLane >= -1 && newLane <= 1) {
            this.lane = newLane;
            
            // Animate lane change
            gsap.to(this.mesh.position, {
                x: this.lane * this.laneWidth,
                duration: 0.2,
                ease: "power2.out"
            });
            
            // Roll animation for the fish
            gsap.to(this.fishMesh.rotation, {
                z: direction * -Math.PI / 4,
                duration: 0.1,
                yoyo: true,
                repeat: 1
            });
        }
    }

    private jump() {
        if (this.mesh.position.y <= 1.1) {
            gsap.to(this.mesh.position, {
                y: 4,
                duration: 0.3,
                ease: "power2.out",
                yoyo: true,
                repeat: 1
            });
        }
    }

    public update(delta: number) {
        if (this.isDead) return;

        // Recover speed over time if slowed down
        if (this.speed < this.optimalSpeed) {
            this.speed += delta * 3; // recover 3 units/sec per second
            if (this.speed > this.optimalSpeed) this.speed = this.optimalSpeed;
        }

        // Move forward constantly
        this.mesh.position.z -= this.speed * delta;
        
        // Slight bobbing animation
        this.fishMesh.position.y = Math.sin(Date.now() * 0.005) * 0.2;
    }

    public hitObstacle() {
        // Drastically reduce speed to let shark catch up
        this.speed = 5;
        
        // Screen shake effect on player
        gsap.to(this.mesh.position, {
            x: this.mesh.position.x + (Math.random() - 0.5),
            y: this.mesh.position.y + (Math.random() - 0.5),
            duration: 0.1,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                // Restore proper X and Y after shake
                this.mesh.position.x = this.lane * this.laneWidth;
                if (this.mesh.position.y < 1) this.mesh.position.y = 1;
            }
        });
    }

    public die() {
        this.isDead = true;
    }

    public reset() {
        this.isDead = false;
        this.mesh.position.set(0, 1, 0);
        this.lane = 0;
        this.speed = 20;
    }
}
