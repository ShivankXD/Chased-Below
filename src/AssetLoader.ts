import * as THREE from 'three';

export class AssetLoader {
    private static textureLoader = new THREE.TextureLoader();

    // Load texture and remove green screen (#00FF00) background
    public static async loadSpriteTexture(url: string, tolerance: number = 80): Promise<THREE.Texture> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject("Canvas 2D context not supported");
                    return;
                }
                
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Check for bright green (chroma key)
                    if (g > 150 && r < g - tolerance && b < g - tolerance) {
                        data[i + 3] = 0; // Set alpha to 0
                    } else if (g > 100 && r < g - tolerance/2 && b < g - tolerance/2) {
                        // Smooth edge
                        data[i + 3] = Math.max(0, 255 - (g - r) * 2);
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                const texture = new THREE.CanvasTexture(canvas);
                texture.colorSpace = THREE.SRGBColorSpace;
                resolve(texture);
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    public static async loadNormalTexture(url: string): Promise<THREE.Texture> {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(url, (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                resolve(texture);
            }, undefined, reject);
        });
    }
}
