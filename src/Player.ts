import * as THREE from 'three';
import gsap from 'gsap';

export class Player {
    public mesh: THREE.Group;
    public speed: number = 30; // Current units per second (increased for excitement)
    public optimalSpeed: number = 30; // Target units per second
    
    public controlEnabled: boolean = true;
    public isDead: boolean = false;
    private fishMesh: THREE.Mesh;

    // Movement state
    private keys: { [key: string]: boolean } = {};
    private moveSpeedXY: number = 20; // units per sec
    private bounds = { x: 12, yMax: 12, yMin: -12 }; // Movement bounds in the pipe/water

    constructor() {
        this.mesh = new THREE.Group();
        
        // Fish Body
        const bodyGeo = new THREE.ConeGeometry(0.6, 2.5, 12);
        bodyGeo.rotateX(Math.PI / 2); // Point forward along Z
        
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffaa00, // orange clownfish-like color
            roughness: 0.3,
            metalness: 0.1
        });
        
        this.fishMesh = new THREE.Mesh(bodyGeo, material);
        
        // Tail
        const tailGeo = new THREE.ConeGeometry(0.4, 1, 4);
        tailGeo.rotateX(-Math.PI / 2);
        const tail = new THREE.Mesh(tailGeo, material);
        tail.position.set(0, 0, 1.5);
        this.fishMesh.add(tail);

        // Fins
        const finGeo = new THREE.ConeGeometry(0.2, 1, 4);
        const leftFin = new THREE.Mesh(finGeo, material);
        leftFin.rotation.z = Math.PI / 2;
        leftFin.position.set(-0.6, 0, 0.5);
        this.fishMesh.add(leftFin);

        const rightFin = new THREE.Mesh(finGeo, material);
        rightFin.rotation.z = -Math.PI / 2;
        rightFin.position.set(0.6, 0, 0.5);
        this.fishMesh.add(rightFin);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.3, 0.4, -0.8);
        const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), pupilMat);
        leftPupil.position.set(-0.05, 0, -0.1);
        leftEye.add(leftPupil);
        this.fishMesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.3, 0.4, -0.8);
        const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), pupilMat);
        rightPupil.position.set(0.05, 0, -0.1);
        rightEye.add(rightPupil);
        this.fishMesh.add(rightEye);

        this.mesh.add(this.fishMesh);

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
                
                // Animate tilt
                gsap.to(this.fishMesh.rotation, {
                    z: -dx * Math.PI / 4,
                    x: dy * Math.PI / 8,
                    duration: 0.2,
                    overwrite: "auto"
                });
            } else {
                // Return to normal rotation
                gsap.to(this.fishMesh.rotation, {
                    z: 0,
                    x: 0,
                    duration: 0.3,
                    overwrite: "auto"
                });
                
                // Idle bobbing
                this.fishMesh.position.y = Math.sin(Date.now() * 0.005) * 0.2;
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
        this.fishMesh.rotation.set(0, 0, 0);
    }
}
