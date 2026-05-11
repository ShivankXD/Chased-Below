import * as THREE from 'three';

export class Environment {
    private scene: THREE.Scene;
    private segments: THREE.Mesh[] = [];
    private segmentLength: number = 100;
    private segmentCount: number = 5; // How many segments ahead to render
    private pipeRadius: number = 10;
    private particles: THREE.Points;
    
    // Materials
    private tunnelMaterial: THREE.MeshStandardMaterial;

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        // Create a material for the inside of the pipe
        // Using a basic grid or wireframe-ish look for neon aesthetic first, 
        // can be improved with textures later.
        this.tunnelMaterial = new THREE.MeshStandardMaterial({
            color: 0x051020,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.BackSide,
            wireframe: false // Set to true for a cyber look, or false for solid
        });

        // Add some glowing rings
        
        this.initSegments();
        this.initParticles();
    }

    private initParticles() {
        const particleGeo = new THREE.BufferGeometry();
        const particleCount = 1000;
        const posArray = new Float32Array(particleCount * 3);
        
        for(let i = 0; i < particleCount; i++) {
            posArray[i*3] = (Math.random() - 0.5) * 30; // x
            posArray[i*3+1] = (Math.random() - 0.5) * 30; // y
            posArray[i*3+2] = (Math.random() - 0.5) * 200; // z
        }
        
        particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particleMat = new THREE.PointsMaterial({
            size: 0.2,
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(particleGeo, particleMat);
        this.scene.add(this.particles);
    }

    private initSegments() {
        for (let i = 0; i < this.segmentCount; i++) {
            this.createSegment(i * -this.segmentLength);
        }
    }

    private createSegment(zPos: number) {
        // Main Pipe
        const geometry = new THREE.CylinderGeometry(this.pipeRadius, this.pipeRadius, this.segmentLength, 16, 1, true);
        geometry.rotateX(Math.PI / 2); // Orient along Z axis
        
        const segment = new THREE.Mesh(geometry, this.tunnelMaterial);
        segment.position.z = zPos;
        
        // Add neon rings at the start and end of the segment
        const ringGeo = new THREE.TorusGeometry(this.pipeRadius - 0.1, 0.2, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
        
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.position.z = this.segmentLength / 2;
        segment.add(ring1);
        
        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.position.z = -this.segmentLength / 2;
        segment.add(ring2);

        this.scene.add(segment);
        this.segments.push(segment);
    }

    public update(playerZ: number) {
        // Find the furthest segment
        let furthestZ = 0;
        this.segments.forEach(seg => {
            if (seg.position.z < furthestZ) {
                furthestZ = seg.position.z;
            }
        });

        // Iterate through segments
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            
            // If the segment is behind the player (playerZ is negative, so player is moving towards -Infinity)
            // If segment is at z=0 and player is at z=-150, the segment is 150 units behind.
            // When segment is too far behind, move it to the front
            if (segment.position.z > playerZ + this.segmentLength) {
                segment.position.z = furthestZ - this.segmentLength;
                furthestZ = segment.position.z;
            }
        }

        // Animate particles
        this.particles.position.z = playerZ;
        const positions = this.particles.geometry.attributes.position.array as Float32Array;
        for(let i = 0; i < positions.length; i+=3) {
            positions[i+1] += 0.05; // move up
            positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01; // sway
            if (positions[i+1] > 15) {
                positions[i+1] = -15;
            }
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    public reset() {
        // Reset all segments to starting positions
        for (let i = 0; i < this.segments.length; i++) {
            this.segments[i].position.z = i * -this.segmentLength;
        }
    }
}
