import * as THREE from 'three';

export enum SegmentType {
    OPEN_WATER,
    PIPE,
    TOILET_ENTRY
}

export class Environment {
    private scene: THREE.Scene;
    public segments: { mesh: THREE.Group, type: SegmentType }[] = [];
    private segmentLength: number = 100;
    private segmentCount: number = 6;
    private pipeRadius: number = 15;
    private particles: THREE.Points;
    private causticLight: THREE.PointLight;
    
    // Materials
    private pipeMaterial: THREE.MeshStandardMaterial;
    private sandMaterial: THREE.MeshStandardMaterial;
    private waterSurfaceMaterial: THREE.MeshStandardMaterial;

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        this.pipeMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888, // concrete grey
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.BackSide,
        });

        this.sandMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeddcc, // sand color
            roughness: 1.0,
            metalness: 0.0,
        });

        this.waterSurfaceMaterial = new THREE.MeshStandardMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.8,
            side: THREE.DoubleSide
        });

        // Fake caustics light
        this.causticLight = new THREE.PointLight(0x00ffff, 2, 100);
        this.scene.add(this.causticLight);

        this.initSegments();
        this.initParticles();
    }

    private initParticles() {
        const particleGeo = new THREE.BufferGeometry();
        const particleCount = 2000;
        const posArray = new Float32Array(particleCount * 3);
        
        for(let i = 0; i < particleCount; i++) {
            posArray[i*3] = (Math.random() - 0.5) * 50; // x
            posArray[i*3+1] = (Math.random() - 0.5) * 50; // y
            posArray[i*3+2] = (Math.random() - 0.5) * 300; // z
        }
        
        particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particleMat = new THREE.PointsMaterial({
            size: 0.3,
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            blending: THREE.NormalBlending, // better for realistic cartoon bubbles
            map: this.createBubbleTexture()
        });
        
        this.particles = new THREE.Points(particleGeo, particleMat);
        this.scene.add(this.particles);
    }

    private createBubbleTexture(): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d')!;
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();
        return new THREE.CanvasTexture(canvas);
    }

    private initSegments() {
        for (let i = 0; i < this.segmentCount; i++) {
            // First few segments are pipes
            const type = (i < 3) ? SegmentType.PIPE : (Math.random() > 0.5 ? SegmentType.PIPE : SegmentType.OPEN_WATER);
            this.createSegment(i * -this.segmentLength, type);
        }
    }

    private createSegment(zPos: number, type: SegmentType) {
        const group = new THREE.Group();
        group.position.z = zPos;

        if (type === SegmentType.PIPE || type === SegmentType.TOILET_ENTRY) {
            // Main Pipe - Concrete look
            const geometry = new THREE.CylinderGeometry(this.pipeRadius, this.pipeRadius, this.segmentLength, 16, 1, true);
            geometry.rotateX(Math.PI / 2); 
            
            const segment = new THREE.Mesh(geometry, this.pipeMaterial);
            group.add(segment);
            
            // Add rusted rings instead of neon
            const ringGeo = new THREE.TorusGeometry(this.pipeRadius - 0.2, 0.5, 8, 32);
            const ringMat = new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 0.9 });
            
            const ring1 = new THREE.Mesh(ringGeo, ringMat);
            ring1.position.z = this.segmentLength / 2;
            group.add(ring1);
        } else if (type === SegmentType.OPEN_WATER) {
            // Sand Floor
            const floorGeo = new THREE.PlaneGeometry(200, this.segmentLength);
            floorGeo.rotateX(-Math.PI / 2);
            const floor = new THREE.Mesh(floorGeo, this.sandMaterial);
            floor.position.y = -this.pipeRadius;
            group.add(floor);

            // Water surface ceiling
            const surfaceGeo = new THREE.PlaneGeometry(200, this.segmentLength);
            surfaceGeo.rotateX(Math.PI / 2);
            const surface = new THREE.Mesh(surfaceGeo, this.waterSurfaceMaterial);
            surface.position.y = this.pipeRadius;
            group.add(surface);

            // Seaweeds / Rocks
            for(let i=0; i<8; i++) {
                const rockGeo = new THREE.DodecahedronGeometry(Math.random() * 3 + 1);
                const rockMat = new THREE.MeshStandardMaterial({ color: 0x667788 });
                const rock = new THREE.Mesh(rockGeo, rockMat);
                rock.position.set(
                    (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 10 + 5), 
                    -this.pipeRadius + 1, 
                    (Math.random() - 0.5) * this.segmentLength
                );
                group.add(rock);
                
                // Simple seaweed cone
                const weedGeo = new THREE.ConeGeometry(0.5, Math.random() * 5 + 3, 4);
                const weedMat = new THREE.MeshStandardMaterial({ color: 0x22aa44 });
                const weed = new THREE.Mesh(weedGeo, weedMat);
                weed.position.set(
                    rock.position.x + 2,
                    -this.pipeRadius + 2,
                    rock.position.z + 2
                );
                group.add(weed);
            }
        }

        this.scene.add(group);
        this.segments.push({ mesh: group, type });
    }

    public update(playerZ: number) {
        let furthestZ = 0;
        this.segments.forEach(seg => {
            if (seg.mesh.position.z < furthestZ) {
                furthestZ = seg.mesh.position.z;
            }
        });

        // Loop segments
        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            
            if (seg.mesh.position.z > playerZ + this.segmentLength) {
                seg.mesh.position.z = furthestZ - this.segmentLength;
                furthestZ = seg.mesh.position.z;

                // Randomize type occasionally
                // NOTE: Cutscene manager will force TOILET_ENTRY
            }
        }

        // Animate particles
        this.particles.position.z = playerZ;
        const positions = this.particles.geometry.attributes.position.array as Float32Array;
        for(let i = 0; i < positions.length; i+=3) {
            positions[i+1] += 0.05; // move up
            positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01; // sway
            if (positions[i+1] > 25) {
                positions[i+1] = -25;
            }
        }
        this.particles.geometry.attributes.position.needsUpdate = true;

        // Animate caustic light
        this.causticLight.position.set(
            Math.sin(Date.now() * 0.002) * 10,
            this.pipeRadius - 2,
            playerZ - 10
        );
        this.causticLight.intensity = 1.5 + Math.sin(Date.now() * 0.005) * 0.5;
    }

    public forceNextSegmentType(type: SegmentType) {
        // Find the segment furthest away and change its type (or next one to recycle)
        // For simplicity, we handle cutscene differently without modifying meshes deeply, 
        // but this could rebuild the furthest segment.
    }

    public reset() {
        for (let i = 0; i < this.segments.length; i++) {
            this.segments[i].mesh.position.z = i * -this.segmentLength;
        }
    }
}
