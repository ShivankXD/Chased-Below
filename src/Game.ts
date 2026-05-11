import * as THREE from 'three';
import { EffectComposer, RenderPass } from 'postprocessing';
import { Player } from './Player';
import { CameraManager } from './CameraManager';
import { Environment } from './Environment';
import { Shark } from './Shark';
import { ObstacleManager } from './ObstacleManager';
import { CoinManager } from './CoinManager';
import { CutsceneManager } from './CutsceneManager';

export class Game {
    private canvas: HTMLCanvasElement;
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private composer: EffectComposer;
    private clock: THREE.Clock;
    
    private player: Player;
    private cameraManager: CameraManager;
    private environment: Environment;
    private shark: Shark;
    private obstacleManager: ObstacleManager;
    private coinManager: CoinManager;
    private cutsceneManager: CutsceneManager;
    
    private isRunning: boolean = false;
    private distanceVal: HTMLElement | null;
    private coinsVal: HTMLElement | null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.distanceVal = document.getElementById('distance-val');
        this.coinsVal = document.getElementById('coins-val');
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Scene — bright cartoon underwater
        this.scene = new THREE.Scene();
        const waterColor = 0x1199dd;
        this.scene.background = new THREE.Color(waterColor);
        this.scene.fog = new THREE.FogExp2(waterColor, 0.004); // very light fog so outer water is visible

        // Lighting — bright and cheerful
        const ambientLight = new THREE.AmbientLight(0xaaddff, 2.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(0, 50, 20);
        this.scene.add(directionalLight);
        
        const hemisphereLight = new THREE.HemisphereLight(0xccffff, 0x004488, 1.2);
        this.scene.add(hemisphereLight);

        // Entities
        this.player = new Player();
        this.scene.add(this.player.mesh);

        this.cameraManager = new CameraManager(this.player, window.innerWidth / window.innerHeight);

        this.environment = new Environment(this.scene);
        this.shark = new Shark(this.player, this.scene);
        this.obstacleManager = new ObstacleManager(this.scene, this.player);
        this.coinManager = new CoinManager(this.scene, this.player);
        this.cutsceneManager = new CutsceneManager(this.player);

        // Postprocessing (just render pass, no bloom)
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.cameraManager.camera);
        this.composer.addPass(renderPass);

        this.clock = new THREE.Clock();
        
        // Start render loop
        this.renderer.setAnimationLoop(this.animate.bind(this));
    }

    public start() {
        this.isRunning = true;
        this.clock.start();
    }

    public restart() {
        this.player.reset();
        this.environment.reset();
        this.shark.reset();
        this.obstacleManager.reset();
        this.coinManager.reset();
        this.cutsceneManager.reset();
        this.isRunning = true;
        this.clock.start();
    }

    private gameOver() {
        this.isRunning = false;
        this.player.die();
        document.getElementById('hud')?.classList.add('hidden');
        document.getElementById('game-over-menu')?.classList.remove('hidden');
        const finalDist = document.getElementById('final-distance');
        if (finalDist) finalDist.innerText = Math.floor(Math.abs(this.player.mesh.position.z)).toString();
    }

    private updateHUD() {
        const dist = Math.floor(Math.abs(this.player.mesh.position.z));
        if (this.distanceVal) this.distanceVal.innerText = dist.toLocaleString();
        
        const scoreVal = document.getElementById('score-val');
        if (scoreVal) scoreVal.innerText = (dist * 8).toLocaleString();

        if (this.coinsVal) this.coinsVal.innerText = this.coinManager.coinsCollected.toString();
    }

    private animate() {
        const delta = this.clock.getDelta();

        if (this.isRunning) {
            this.player.update(delta);
            this.cameraManager.update(delta);
            this.environment.update(this.player.mesh.position.z);
            this.shark.update(delta);
            this.obstacleManager.update(delta);
            this.coinManager.update(delta);
            this.cutsceneManager.update(Math.abs(this.player.mesh.position.z));
            this.updateHUD();

            if (this.shark.hasCaughtPlayer()) {
                this.gameOver();
            }
        } else {
            // Idle camera sway when not playing
            this.cameraManager.camera.position.x = Math.sin(Date.now() * 0.001) * 2;
            this.cameraManager.camera.lookAt(this.player.mesh.position);
        }

        this.composer.render();
    }

    public onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
        this.cameraManager.onResize(width / height);
    }
}
