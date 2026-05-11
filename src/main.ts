import { Game } from './Game';
import { AssetLoader } from './AssetLoader';
import * as THREE from 'three';

export const GameAssets: { [key: string]: THREE.Texture } = {};

let game: Game;

document.addEventListener('DOMContentLoaded', async () => {
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.innerText = 'LOADING ASSETS...';
        startBtn.style.pointerEvents = 'none';
    }

    try {
        GameAssets.fish = await AssetLoader.loadSpriteTexture('/assets/fish.png');
        GameAssets.sharkBack = await AssetLoader.loadSpriteTexture('/assets/shark_back.png');
        GameAssets.sharkFront = await AssetLoader.loadSpriteTexture('/assets/shark_front.png');
        GameAssets.mine = await AssetLoader.loadSpriteTexture('/assets/mine.png');
        GameAssets.barrel = await AssetLoader.loadSpriteTexture('/assets/barrel.png');
        GameAssets.coin = await AssetLoader.loadSpriteTexture('/assets/coin.png');
        
        const tunnelTex = await AssetLoader.loadNormalTexture('/assets/tunnel.png');
        tunnelTex.wrapS = THREE.RepeatWrapping;
        tunnelTex.wrapT = THREE.RepeatWrapping;
        tunnelTex.repeat.set(2, 5); // adjust based on cylinder
        GameAssets.tunnel = tunnelTex;

        const aquariumTex = await AssetLoader.loadNormalTexture('/assets/aquarium.png');
        aquariumTex.wrapS = THREE.RepeatWrapping;
        aquariumTex.wrapT = THREE.RepeatWrapping;
        aquariumTex.repeat.set(2, 5);
        GameAssets.aquarium = aquariumTex;
    } catch(e) {
        console.error("Failed to load assets", e);
    }

    if (startBtn) {
        startBtn.innerText = 'PLAY';
        startBtn.style.pointerEvents = 'auto';
    }

    const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
    game = new Game(canvas);

    const restartBtn = document.getElementById('restart-btn');
    
    startBtn?.addEventListener('click', () => {
        document.getElementById('start-menu')?.classList.add('hidden');
        document.getElementById('hud')?.classList.remove('hidden');
        game.start();
    });

    restartBtn?.addEventListener('click', () => {
        document.getElementById('game-over-menu')?.classList.add('hidden');
        document.getElementById('hud')?.classList.remove('hidden');
        game.restart();
    });

    // Window resize handling
    window.addEventListener('resize', () => {
        game.onWindowResize();
    });
});
