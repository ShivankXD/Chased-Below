import gsap from 'gsap';
import { Player } from './Player';

export class CutsceneManager {
    private player: Player;
    public isCutsceneActive: boolean = false;
    private audioContext: AudioContext | null = null;
    private lastTriggerThreshold: number = 0;

    constructor(player: Player) {
        this.player = player;
    }

    private playHehhhSound() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 1);
    }

    public triggerToiletJump() {
        if (this.isCutsceneActive) return;
        this.isCutsceneActive = true;
        this.player.controlEnabled = false;

        const tl = gsap.timeline({
            onComplete: () => {
                this.isCutsceneActive = false;
                this.player.controlEnabled = true;
            }
        });

        // Move to center of pipe
        tl.to(this.player.mesh.position, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "power2.inOut"
        });

        // Shoot up
        tl.to(this.player.mesh.position, {
            y: 30,
            duration: 1,
            ease: "power2.out",
            onStart: () => {
                this.playHehhhSound();
            }
        });

        // Arc down
        tl.to(this.player.mesh.position, {
            y: 0,
            duration: 1,
            ease: "power2.in"
        });
    }

    public update(distance: number) {
        // Trigger toilet cutscene every 1500 units, but only once per threshold
        const threshold = Math.floor(distance / 1500);
        if (!this.isCutsceneActive && threshold > this.lastTriggerThreshold && threshold > 0) {
            this.lastTriggerThreshold = threshold;
            this.triggerToiletJump();
        }
    }

    public reset() {
        this.lastTriggerThreshold = 0;
        this.isCutsceneActive = false;
    }
}
