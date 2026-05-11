import * as THREE from 'three';
import { Player } from './Player';

export class CameraManager {
    public camera: THREE.PerspectiveCamera;
    private targetPlayer: Player;
    
    // Camera follows slightly behind and above, but loosely tracks X/Y
    private offsetZ = 12;
    private offsetY = 4;

    constructor(player: Player, aspectRatio: number) {
        this.targetPlayer = player;
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    }

    public update(delta: number) {
        // We want the camera to stay behind the player in Z tightly, 
        // but follow X and Y with some springiness.
        
        const targetZ = this.targetPlayer.mesh.position.z + this.offsetZ;
        const targetX = this.targetPlayer.mesh.position.x * 0.5; // only follow half the X distance so player can move to edges of screen
        const targetY = this.targetPlayer.mesh.position.y * 0.5 + this.offsetY;

        this.camera.position.z = targetZ;
        
        this.camera.position.x += (targetX - this.camera.position.x) * delta * 5;
        this.camera.position.y += (targetY - this.camera.position.y) * delta * 5;
        
        // Look ahead of the player
        const lookAtTarget = new THREE.Vector3(
            this.targetPlayer.mesh.position.x * 0.5,
            this.targetPlayer.mesh.position.y * 0.5,
            this.targetPlayer.mesh.position.z - 20
        );
        this.camera.lookAt(lookAtTarget);
    }

    public onResize(aspectRatio: number) {
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
    }
}
