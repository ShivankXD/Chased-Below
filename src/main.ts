import { Game } from './Game';

let game: Game;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
    game = new Game(canvas);

    const startBtn = document.getElementById('start-btn');
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
