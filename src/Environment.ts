import * as THREE from 'three';
import { GameAssets } from './main';

export const SegmentType = {
    PIPE: 0,
    OPEN_WATER: 1,
    AQUARIUM: 2,
    LOOP_PIPE: 3,
    TOILET_ENTRY: 4
} as const;
export type SegmentType = typeof SegmentType[keyof typeof SegmentType];

export class Environment {
    private scene: THREE.Scene;
    public segments: { mesh: THREE.Group, type: SegmentType }[] = [];
    private segmentLength: number = 100;
    private segmentCount: number = 8;
    private pipeRadius: number = 25;
    private particles!: THREE.Points;
    private causticLight!: THREE.PointLight;
    
    // Materials
    private pipeMaterial!: THREE.MeshStandardMaterial;
    private aquariumMaterial!: THREE.MeshStandardMaterial;
    private sandMaterial!: THREE.MeshStandardMaterial;
    private waterSurfaceMaterial!: THREE.MeshStandardMaterial;

    // Outer water sphere (always visible behind transparent pipes)
    private outerWater!: THREE.Mesh;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.buildMaterials();
        this.buildOuterWater();

        // Caustics light
        this.causticLight = new THREE.PointLight(0x00ffff, 2, 100);
        this.scene.add(this.causticLight);

        this.initSegments();
        this.initParticles();
    }

    private buildMaterials() {
        // TRANSPARENT pipe — you can see outer water through it
        this.pipeMaterial = new THREE.MeshStandardMaterial({
            map: GameAssets.tunnel,
            color: 0xcccccc,
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
        });

        // TRANSPARENT glass aquarium — very see-through
        this.aquariumMaterial = new THREE.MeshStandardMaterial({
            map: GameAssets.aquarium,
            color: 0xccffff,
            roughness: 0.1,
            metalness: 0.6,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.45,
            depthWrite: false,
        });

        this.sandMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeddcc,
            roughness: 1.0,
            metalness: 0.0,
        });

        this.waterSurfaceMaterial = new THREE.MeshStandardMaterial({
            color: 0x44ccff,
            transparent: true,
            opacity: 0.35,
            roughness: 0.1,
            metalness: 0.8,
            side: THREE.DoubleSide
        });
    }

    private buildOuterWater() {
        // A massive sphere around the entire scene that represents the outer ocean
        // The player sees this through the transparent pipe walls
        const outerGeo = new THREE.SphereGeometry(500, 32, 32);
        const outerMat = new THREE.MeshStandardMaterial({
            color: 0x0066aa,
            roughness: 1.0,
            metalness: 0.0,
            side: THREE.BackSide,
        });
        this.outerWater = new THREE.Mesh(outerGeo, outerMat);
        this.scene.add(this.outerWater);

        // Scattered outer decorations (rocks, coral visible outside the pipe)
        const colors = [0x445566, 0x556644, 0x664455, 0x335577];
        for (let i = 0; i < 40; i++) {
            const rockGeo = new THREE.DodecahedronGeometry(Math.random() * 8 + 3);
            const rockMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] });
            const rock = new THREE.Mesh(rockGeo, rockMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = this.pipeRadius + 10 + Math.random() * 40;
            rock.position.set(
                Math.cos(angle) * dist,
                Math.sin(angle) * dist,
                (Math.random() - 0.5) * 600
            );
            this.scene.add(rock);
        }

        // Outer seaweed
        for (let i = 0; i < 20; i++) {
            const weedGeo = new THREE.ConeGeometry(1.5, Math.random() * 15 + 8, 5);
            const weedMat = new THREE.MeshStandardMaterial({ color: 0x22aa55 });
            const weed = new THREE.Mesh(weedGeo, weedMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = this.pipeRadius + 5 + Math.random() * 30;
            weed.position.set(
                Math.cos(angle) * dist,
                -this.pipeRadius - Math.random() * 10,
                (Math.random() - 0.5) * 600
            );
            this.scene.add(weed);
        }
    }

    private initParticles() {
        const particleGeo = new THREE.BufferGeometry();
        const particleCount = 3000;
        const posArray = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            posArray[i * 3] = (Math.random() - 0.5) * 60;
            posArray[i * 3 + 1] = (Math.random() - 0.5) * 60;
            posArray[i * 3 + 2] = (Math.random() - 0.5) * 400;
        }
        
        particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particleMat = new THREE.PointsMaterial({
            size: 0.4,
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.NormalBlending,
            map: this.createBubbleTexture()
        });
        
        this.particles = new THREE.Points(particleGeo, particleMat);
        this.scene.add(this.particles);
    }

    private createBubbleTexture(): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        
        const gradient = ctx.createRadialGradient(32, 28, 2, 32, 32, 28);
        gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
        gradient.addColorStop(0.3, 'rgba(200,240,255,0.4)');
        gradient.addColorStop(1, 'rgba(100,200,255,0.0)');
        
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(22, 22, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fill();
        
        return new THREE.CanvasTexture(canvas);
    }

    private initSegments() {
        const pattern: SegmentType[] = [
            SegmentType.PIPE, SegmentType.PIPE, SegmentType.PIPE,
            SegmentType.OPEN_WATER,
            SegmentType.AQUARIUM,
            SegmentType.PIPE, SegmentType.LOOP_PIPE,
            SegmentType.PIPE
        ];
        for (let i = 0; i < this.segmentCount; i++) {
            this.createSegment(i * -this.segmentLength, pattern[i % pattern.length]);
        }
    }

    private createSegment(zPos: number, type: SegmentType) {
        const group = new THREE.Group();
        group.position.z = zPos;

        if (type === SegmentType.PIPE || type === SegmentType.TOILET_ENTRY) {
            this.buildPipeSegment(group);
        } else if (type === SegmentType.OPEN_WATER) {
            this.buildOpenWaterSegment(group);
        } else if (type === SegmentType.AQUARIUM) {
            this.buildAquariumSegment(group);
        } else if (type === SegmentType.LOOP_PIPE) {
            this.buildLoopPipeSegment(group);
        }

        this.scene.add(group);
        this.segments.push({ mesh: group, type });
    }

    private buildPipeSegment(group: THREE.Group) {
        // Slightly longer than segmentLength so segments overlap and hide seams
        const overlapLength = this.segmentLength + 4;
        const geometry = new THREE.CylinderGeometry(this.pipeRadius, this.pipeRadius, overlapLength, 24, 1, true);
        geometry.rotateX(Math.PI / 2);
        const segment = new THREE.Mesh(geometry, this.pipeMaterial);
        group.add(segment);

        // Cartoon bolts/rings (these also help mask seams)
        for (let r = -1; r <= 1; r++) {
            const ringGeo = new THREE.TorusGeometry(this.pipeRadius + 0.5, 1.0, 8, 32);
            const ringMat = new THREE.MeshStandardMaterial({ 
                color: 0x886633, roughness: 0.8,
                transparent: true, opacity: 0.85
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.z = r * (this.segmentLength / 3);
            group.add(ring);
        }

        // Dripping water drops
        for (let d = 0; d < 6; d++) {
            const dropGeo = new THREE.SphereGeometry(0.4, 8, 8);
            const dropMat = new THREE.MeshStandardMaterial({ 
                color: 0x88ccff, transparent: true, opacity: 0.6 
            });
            const drop = new THREE.Mesh(dropGeo, dropMat);
            const angle = Math.random() * Math.PI * 2;
            drop.position.set(
                Math.cos(angle) * (this.pipeRadius - 1),
                Math.sin(angle) * (this.pipeRadius - 1),
                (Math.random() - 0.5) * this.segmentLength
            );
            group.add(drop);
        }

        // Green algae patches
        for (let a = 0; a < 5; a++) {
            const algaeGeo = new THREE.PlaneGeometry(6, 4);
            const algaeMat = new THREE.MeshStandardMaterial({ 
                color: 0x33aa44, transparent: true, opacity: 0.6, side: THREE.DoubleSide 
            });
            const algae = new THREE.Mesh(algaeGeo, algaeMat);
            const angle = Math.random() * Math.PI * 2;
            algae.position.set(
                Math.cos(angle) * (this.pipeRadius - 0.5),
                Math.sin(angle) * (this.pipeRadius - 0.5),
                (Math.random() - 0.5) * this.segmentLength
            );
            algae.lookAt(0, 0, algae.position.z);
            group.add(algae);
        }
    }

    private buildOpenWaterSegment(group: THREE.Group) {
        // Sand floor
        const floorGeo = new THREE.PlaneGeometry(200, this.segmentLength + 4);
        floorGeo.rotateX(-Math.PI / 2);
        const floor = new THREE.Mesh(floorGeo, this.sandMaterial);
        floor.position.y = -this.pipeRadius;
        group.add(floor);

        // Water surface
        const surfaceGeo = new THREE.PlaneGeometry(200, this.segmentLength + 4);
        surfaceGeo.rotateX(Math.PI / 2);
        const surface = new THREE.Mesh(surfaceGeo, this.waterSurfaceMaterial);
        surface.position.y = this.pipeRadius;
        group.add(surface);

        // Colorful coral and seaweed
        const colors = [0xff6644, 0xff44aa, 0xffaa22, 0x44ff88, 0x22ccff];
        for (let i = 0; i < 12; i++) {
            const coralGeo = new THREE.DodecahedronGeometry(Math.random() * 2 + 1);
            const coralMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] });
            const coral = new THREE.Mesh(coralGeo, coralMat);
            coral.position.set(
                (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 15 + 5),
                -this.pipeRadius + 1,
                (Math.random() - 0.5) * this.segmentLength
            );
            group.add(coral);

            const weedGeo = new THREE.ConeGeometry(0.6, Math.random() * 6 + 3, 5);
            const weedMat = new THREE.MeshStandardMaterial({ color: 0x22cc55 });
            const weed = new THREE.Mesh(weedGeo, weedMat);
            weed.position.set(
                coral.position.x + (Math.random() - 0.5) * 4,
                -this.pipeRadius + 2,
                coral.position.z + (Math.random() - 0.5) * 5
            );
            group.add(weed);
        }
    }

    private buildAquariumSegment(group: THREE.Group) {
        // Glass tunnel — very transparent
        const overlapLength = this.segmentLength + 4;
        const geometry = new THREE.CylinderGeometry(this.pipeRadius, this.pipeRadius, overlapLength, 24, 1, true);
        geometry.rotateX(Math.PI / 2);
        const segment = new THREE.Mesh(geometry, this.aquariumMaterial);
        group.add(segment);

        // Bright aquarium light
        const aquaLight = new THREE.PointLight(0x44ffcc, 3, 80);
        aquaLight.position.set(0, 10, 0);
        group.add(aquaLight);

        // Entry pipe (small pipe sticking out at entrance)
        const entryPipeGeo = new THREE.CylinderGeometry(5, 5, 15, 12, 1, true);
        entryPipeGeo.rotateX(Math.PI / 2);
        const entryPipeMat = new THREE.MeshStandardMaterial({
            color: 0x448855, roughness: 0.7, side: THREE.BackSide,
            transparent: true, opacity: 0.7
        });
        const entryPipe = new THREE.Mesh(entryPipeGeo, entryPipeMat);
        entryPipe.position.z = this.segmentLength / 2 + 5;
        group.add(entryPipe);

        // Exit pipe (small pipe at other end going back to canal)
        const exitPipe = new THREE.Mesh(entryPipeGeo, entryPipeMat);
        exitPipe.position.z = -this.segmentLength / 2 - 5;
        group.add(exitPipe);

        // Glowing entry/exit rings
        const ringGeo = new THREE.TorusGeometry(this.pipeRadius + 0.5, 1.5, 8, 32);
        const ringMat = new THREE.MeshStandardMaterial({ 
            color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.4,
            transparent: true, opacity: 0.8
        });
        
        const entryRing = new THREE.Mesh(ringGeo, ringMat);
        entryRing.position.z = this.segmentLength / 2;
        group.add(entryRing);

        const exitRing = new THREE.Mesh(ringGeo, ringMat);
        exitRing.position.z = -this.segmentLength / 2;
        group.add(exitRing);

        // Lots of colorful coral lining the walls (OUTSIDE the glass visible through it)
        const colors = [0xff3366, 0xff9922, 0x22ddff, 0xaaff00, 0xff44ff];
        for (let i = 0; i < 20; i++) {
            const coralGeo = new THREE.DodecahedronGeometry(Math.random() * 3 + 1);
            const coralMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] });
            const coral = new THREE.Mesh(coralGeo, coralMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = this.pipeRadius + 2 + Math.random() * 5;
            coral.position.set(
                Math.cos(angle) * dist,
                Math.sin(angle) * dist,
                (Math.random() - 0.5) * this.segmentLength
            );
            group.add(coral);
        }

        // Jellyfish-like glowing orbs (outside the glass)
        for (let j = 0; j < 10; j++) {
            const jellyGeo = new THREE.SphereGeometry(1, 16, 16);
            const jellyMat = new THREE.MeshStandardMaterial({
                color: 0xff88ff,
                emissive: 0xff44ff,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.7
            });
            const jelly = new THREE.Mesh(jellyGeo, jellyMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = this.pipeRadius + 3 + Math.random() * 8;
            jelly.position.set(
                Math.cos(angle) * dist,
                Math.sin(angle) * dist,
                (Math.random() - 0.5) * this.segmentLength
            );
            group.add(jelly);
        }

        // Small tropical fish sprites outside glass
        for (let f = 0; f < 6; f++) {
            const fishGeo = new THREE.SphereGeometry(0.6, 8, 8);
            const fishMat = new THREE.MeshStandardMaterial({ 
                color: colors[f % colors.length],
                emissive: colors[f % colors.length],
                emissiveIntensity: 0.2
            });
            const fish = new THREE.Mesh(fishGeo, fishMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = this.pipeRadius + 4 + Math.random() * 6;
            fish.position.set(
                Math.cos(angle) * dist,
                Math.sin(angle) * dist,
                (Math.random() - 0.5) * this.segmentLength
            );
            group.add(fish);
        }
    }

    private buildLoopPipeSegment(group: THREE.Group) {
        // The main pipe continues straight but a visible folded/looping pipe
        // branches off, loops around in a full circle, and reconnects

        // Main straight pipe
        const overlapLength = this.segmentLength + 4;
        const mainGeo = new THREE.CylinderGeometry(this.pipeRadius, this.pipeRadius, overlapLength, 24, 1, true);
        mainGeo.rotateX(Math.PI / 2);
        const mainPipe = new THREE.Mesh(mainGeo, this.pipeMaterial);
        group.add(mainPipe);

        // The loop pipe (a torus that branches off and reconnects)
        const loopRadius = 15;
        const tubeRadius = 5;
        const loopGeo = new THREE.TorusGeometry(loopRadius, tubeRadius, 16, 48);
        const loopMat = new THREE.MeshStandardMaterial({
            map: GameAssets.tunnel,
            color: 0xcc8844,
            roughness: 0.8,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const loopMesh = new THREE.Mesh(loopGeo, loopMat);
        // Position to the right, vertical loop like a roller coaster
        loopMesh.position.set(this.pipeRadius + loopRadius, 0, 0);
        loopMesh.rotation.y = Math.PI / 2;
        group.add(loopMesh);

        // Connector from main pipe to loop (entry)
        const connGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, this.pipeRadius * 0.4, 12, 1, true);
        connGeo.rotateZ(Math.PI / 2);
        const connMat = new THREE.MeshStandardMaterial({
            color: 0xcc8844, roughness: 0.8, side: THREE.DoubleSide,
            transparent: true, opacity: 0.7
        });
        const conn1 = new THREE.Mesh(connGeo, connMat);
        conn1.position.set(this.pipeRadius * 0.7, 0, loopRadius);
        group.add(conn1);

        // Connector back (exit)
        const conn2 = new THREE.Mesh(connGeo, connMat);
        conn2.position.set(this.pipeRadius * 0.7, 0, -loopRadius);
        group.add(conn2);

        // Glowing entry/exit rings on main pipe wall
        const arrowGeo = new THREE.TorusGeometry(tubeRadius + 1, 0.8, 8, 32);
        const arrowMat = new THREE.MeshStandardMaterial({ 
            color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.6,
            transparent: true, opacity: 0.9
        });
        
        const arrow1 = new THREE.Mesh(arrowGeo, arrowMat);
        arrow1.position.set(this.pipeRadius - 1, 0, loopRadius);
        arrow1.rotation.y = Math.PI / 2;
        group.add(arrow1);

        const arrow2 = new THREE.Mesh(arrowGeo, arrowMat);
        arrow2.position.set(this.pipeRadius - 1, 0, -loopRadius);
        arrow2.rotation.y = Math.PI / 2;
        group.add(arrow2);

        // Rings on main pipe (same as regular)
        for (let r = -1; r <= 1; r++) {
            const ringGeo = new THREE.TorusGeometry(this.pipeRadius + 0.5, 1.0, 8, 32);
            const ringMat = new THREE.MeshStandardMaterial({ 
                color: 0x886633, roughness: 0.8,
                transparent: true, opacity: 0.85
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.z = r * (this.segmentLength / 3);
            group.add(ring);
        }
    }

    public update(playerZ: number) {
        // Move outer water sphere with player so it's always surrounding them
        this.outerWater.position.z = playerZ;

        let furthestZ = 0;
        this.segments.forEach(seg => {
            if (seg.mesh.position.z < furthestZ) {
                furthestZ = seg.mesh.position.z;
            }
        });

        // Recycle segments
        const segmentTypes: SegmentType[] = [
            SegmentType.PIPE, SegmentType.PIPE, SegmentType.OPEN_WATER,
            SegmentType.AQUARIUM, SegmentType.PIPE, SegmentType.LOOP_PIPE,
            SegmentType.PIPE, SegmentType.PIPE
        ];

        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            if (seg.mesh.position.z > playerZ + this.segmentLength) {
                this.scene.remove(seg.mesh);
                const newType = segmentTypes[Math.floor(Math.random() * segmentTypes.length)];
                const newGroup = new THREE.Group();
                newGroup.position.z = furthestZ - this.segmentLength;
                furthestZ = newGroup.position.z;

                if (newType === SegmentType.PIPE) this.buildPipeSegment(newGroup);
                else if (newType === SegmentType.OPEN_WATER) this.buildOpenWaterSegment(newGroup);
                else if (newType === SegmentType.AQUARIUM) this.buildAquariumSegment(newGroup);
                else if (newType === SegmentType.LOOP_PIPE) this.buildLoopPipeSegment(newGroup);

                this.scene.add(newGroup);
                this.segments[i] = { mesh: newGroup, type: newType };
            }
        }

        // Animate particles
        this.particles.position.z = playerZ;
        const positions = this.particles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += 0.04;
            positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01;
            if (positions[i + 1] > 30) positions[i + 1] = -30;
        }
        this.particles.geometry.attributes.position.needsUpdate = true;

        // Caustic light follows player
        this.causticLight.position.set(
            Math.sin(Date.now() * 0.002) * 15,
            this.pipeRadius - 3,
            playerZ - 10
        );
        this.causticLight.intensity = 2 + Math.sin(Date.now() * 0.005) * 0.8;
    }

    public reset() {
        this.segments.forEach(seg => this.scene.remove(seg.mesh));
        this.segments = [];
        this.initSegments();
    }
}
