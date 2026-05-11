import * as THREE from 'three';
import { Player } from './Player';

export class CameraManager {
    public camera: THREE.PerspectiveCamera;
    private targetPlayer: Player;
    
    // Camera settings relative to player
    private offset = new THREE.Vector3(0, 5, 10);
    private lookAtOffset = new THREE.Vector3(0, 0, -10);

    constructor(player: Player, aspectRatio: number) {
        this.targetPlayer = player;
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    }

    public update(delta: number) {
        const targetPosition = this.targetPlayer.mesh.position.clone().add(this.offset);
        
        // Smoothly interpolate camera position
        this.camera.position.lerp(targetPosition, 5 * delta);
        
        // Always look ahead of the player
        const lookAtTarget = this.targetPlayer.mesh.position.clone().add(this.lookAtOffset);
        this.camera.lookAt(lookAtTarget);
    }

    public onResize(aspectRatio: number) {
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
    }
}
