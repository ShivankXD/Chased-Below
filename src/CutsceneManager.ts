import * as THREE from 'three';
import gsap from 'gsap';
import { Player } from './Player';

export class CutsceneManager {
    private player: Player;
    public isCutsceneActive: boolean = false;
    private audioContext: AudioContext | null = null;

    constructor(player: Player) {
        this.player = player;
    }

    private playHehhhSound() {
        // Using Web Audio API oscillator as a placeholder for a human shout
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime); // Low pitch
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5); // drop
        
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

        // Sequence: 
        // 1. Move to center
        // 2. Fly up fast (out of toilet)
        // 3. Play sound "hehhh"
        // 4. Arc down into next pipe
        // 5. Re-enable controls

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
            y: 30, // High above
            duration: 1,
            ease: "power2.out",
            onStart: () => {
                this.playHehhhSound();
                // Tilt fish up
                gsap.to(this.player.mesh.children[0].rotation, { x: -Math.PI / 4, duration: 0.5 });
            }
        });

        // Arc down
        tl.to(this.player.mesh.position, {
            y: 0,
            duration: 1,
            ease: "power2.in",
            onStart: () => {
                // Tilt fish down
                gsap.to(this.player.mesh.children[0].rotation, { x: Math.PI / 4, duration: 0.5 });
            },
            onComplete: () => {
                // Reset rotation
                gsap.to(this.player.mesh.children[0].rotation, { x: 0, duration: 0.2 });
            }
        });
    }

    public update(distance: number) {
        // Trigger toilet cutscene every 1500 units for demo purposes
        // Make sure it only triggers once per threshold
        if (!this.isCutsceneActive && distance > 0 && distance % 1500 < 20) {
            this.triggerToiletJump();
        }
    }
}
