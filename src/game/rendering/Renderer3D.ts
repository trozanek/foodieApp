import * as THREE from 'three';
import { Camera, Decoration, Platform, Sprite, Particle, Projectile } from '../types';

// Depth layers (Z positions) - higher = closer to camera
const Z_BACKGROUND = -10;
const Z_WINDOWS = -6;
const Z_DECORATIONS = -3;
const Z_PLATFORMS = 0;
const Z_ENTITIES = 1;
const Z_PROJECTILES = 2;
const Z_PARTICLES = 3;
const Z_HUD = 10;

const PIXEL_SCALE = 4; // Bigger pixel scale for 3D (was 3 in 2D)

export class Renderer3D {
  private threeRenderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera3D: THREE.OrthographicCamera;
  readonly width: number;
  readonly height: number;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  // Pools for reusable meshes
  private rectPool: THREE.Mesh[] = [];
  private rectPoolIndex: number = 0;
  private spriteTexCache: Map<string, THREE.Texture> = new Map();

  // HUD overlay - uses a separate 2D canvas
  private hudCanvas: HTMLCanvasElement;
  private hudCtx: CanvasRenderingContext2D;
  private hudTexture: THREE.CanvasTexture;
  private hudSprite: THREE.Sprite;

  // Background elements (persistent)
  private bgGroup: THREE.Group;
  private bgInitialized: boolean = false;

  // Frame groups (cleared each frame)
  private frameGroup: THREE.Group;

  // Ambient light for atmosphere
  private ambientLight: THREE.AmbientLight;
  private pointLights: THREE.PointLight[] = [];

  // Zoom state
  private currentZoom: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;

    // Three.js renderer
    this.threeRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
    });
    this.threeRenderer.setSize(this.width, this.height);
    this.threeRenderer.setClearColor(0x0a0a12);
    this.threeRenderer.setPixelRatio(1); // Keep pixel-perfect

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0008);

    // Orthographic camera for side-view with slight perspective feel
    const aspect = this.width / this.height;
    const frustumSize = this.height;
    this.camera3D = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    this.camera3D.position.set(0, 0, 20);
    this.camera3D.lookAt(0, 0, 0);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0x221133, 1.5);
    this.scene.add(this.ambientLight);

    // Add directional light for depth shadows
    const dirLight = new THREE.DirectionalLight(0xff00ff, 0.3);
    dirLight.position.set(-1, 1, 2);
    this.scene.add(dirLight);

    // Background group (persistent across frames)
    this.bgGroup = new THREE.Group();
    this.scene.add(this.bgGroup);

    // Frame group (rebuilt each frame)
    this.frameGroup = new THREE.Group();
    this.scene.add(this.frameGroup);

    // HUD overlay canvas
    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.width = this.width;
    this.hudCanvas.height = this.height;
    const ctx = this.hudCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get HUD 2D context');
    this.hudCtx = ctx;

    this.hudTexture = new THREE.CanvasTexture(this.hudCanvas);
    this.hudTexture.minFilter = THREE.NearestFilter;
    this.hudTexture.magFilter = THREE.NearestFilter;

    const hudMat = new THREE.SpriteMaterial({
      map: this.hudTexture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.hudSprite = new THREE.Sprite(hudMat);
    this.hudSprite.scale.set(this.width, this.height, 1);
    this.hudSprite.position.set(0, 0, Z_HUD);
    this.hudSprite.renderOrder = 999;
    this.scene.add(this.hudSprite);
  }

  clear(): void {
    // Clear frame group
    while (this.frameGroup.children.length > 0) {
      const child = this.frameGroup.children[0];
      this.frameGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        // Return to pool or dispose
      }
    }
    this.rectPoolIndex = 0;

    // Clear HUD
    this.hudCtx.clearRect(0, 0, this.width, this.height);
  }

  beginFrame(camera: Camera, zoomLevel: number = 1): void {
    this.shakeOffsetX = camera.shakeAmount * (Math.random() - 0.5);
    this.shakeOffsetY = camera.shakeAmount * (Math.random() - 0.5);
    this.currentZoom = zoomLevel;

    // Position the 3D camera to match the game camera
    const cx = camera.x + this.width / 2 + this.shakeOffsetX;
    const cy = -(camera.y + this.height / 2 + this.shakeOffsetY);
    this.camera3D.position.set(cx, cy, 20);

    // Apply zoom
    const aspect = this.width / this.height;
    const frustumSize = this.height / zoomLevel;
    this.camera3D.left = -frustumSize * aspect / 2;
    this.camera3D.right = frustumSize * aspect / 2;
    this.camera3D.top = frustumSize / 2;
    this.camera3D.bottom = -frustumSize / 2;
    this.camera3D.updateProjectionMatrix();
  }

  endFrame(): void {
    // Update HUD texture
    this.hudTexture.needsUpdate = true;
    // Position HUD to always be in front of camera
    this.hudSprite.position.set(
      this.camera3D.position.x,
      this.camera3D.position.y,
      Z_HUD
    );
    const aspect = this.width / this.height;
    const frustumSize = this.height / this.currentZoom;
    this.hudSprite.scale.set(frustumSize * aspect, frustumSize, 1);

    // Render
    this.threeRenderer.render(this.scene, this.camera3D);
  }

  // --- Helper to create colored box mesh ---
  private createBox(
    x: number, y: number, z: number,
    w: number, h: number, d: number,
    color: number | string, opacity: number = 1
  ): THREE.Mesh {
    const geo = new THREE.BoxGeometry(w, h, d);
    const hex = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color;
    const mat = new THREE.MeshLambertMaterial({
      color: hex,
      transparent: opacity < 1,
      opacity,
    });
    const mesh = new THREE.Mesh(geo, mat);
    // Convert from game coords (y-down) to Three.js (y-up)
    mesh.position.set(x + w / 2, -(y + h / 2), z);
    return mesh;
  }

  private createPlane(
    x: number, y: number, z: number,
    w: number, h: number,
    color: number | string, opacity: number = 1
  ): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(w, h);
    const hex = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color;
    const mat = new THREE.MeshBasicMaterial({
      color: hex,
      transparent: opacity < 1,
      opacity,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x + w / 2, -(y + h / 2), z);
    return mesh;
  }

  // --- Sprite rendering (pixel art on textured plane) ---
  private getSpriteTexture(sprite: Sprite, scale: number): THREE.Texture {
    const key = sprite.pixels.map(r => r.join('')).join('|') + scale;
    let tex = this.spriteTexCache.get(key);
    if (tex) return tex;

    const canvas = document.createElement('canvas');
    canvas.width = sprite.width * scale;
    canvas.height = sprite.height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    for (let py = 0; py < sprite.height; py++) {
      for (let px = 0; px < sprite.width; px++) {
        const color = sprite.pixels[py][px];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(px * scale, py * scale, scale, scale);
        }
      }
    }

    tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    this.spriteTexCache.set(key, tex);
    return tex;
  }

  drawSprite(sprite: Sprite, x: number, y: number, _camera: Camera, scale: number = PIXEL_SCALE): void {
    const tex = this.getSpriteTexture(sprite, scale);
    const w = sprite.width * scale;
    const h = sprite.height * scale;
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x + w / 2, -(y + h / 2), Z_ENTITIES);
    this.frameGroup.add(mesh);
  }

  drawRect(x: number, y: number, w: number, h: number, color: string, _camera: Camera): void {
    let opacity = 1;
    let hex = color;
    // Parse rgba
    if (color.startsWith('rgba')) {
      const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        opacity = parseFloat(match[4]);
        hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      }
    }
    // Handle hex with alpha (e.g., #ffffff88)
    if (hex.length === 9 && hex.startsWith('#')) {
      opacity = parseInt(hex.slice(7, 9), 16) / 255;
      hex = hex.slice(0, 7);
    }
    const mesh = this.createPlane(x, y, Z_ENTITIES, w, h, hex, opacity);
    this.frameGroup.add(mesh);
  }

  drawPlatform(platform: Platform, _camera: Camera): void {
    const depth = 40; // 3D depth for platforms

    if (platform.type === 'jumppad') {
      // Glowing green jump pad - 3D box
      const mesh = this.createBox(
        platform.x, platform.y, Z_PLATFORMS,
        platform.width, platform.height, depth * 0.5,
        0x00aa55
      );
      this.frameGroup.add(mesh);

      // Glow top
      const glow = this.createBox(
        platform.x + 2, platform.y, Z_PLATFORMS + depth * 0.3,
        platform.width - 4, 3, 5,
        0x00ff88
      );
      this.frameGroup.add(glow);

      // Animated glow aura
      const glowAlpha = 0.3 + 0.2 * Math.sin(Date.now() / 200);
      const aura = this.createPlane(
        platform.x - 2, platform.y - 8, Z_PLATFORMS + depth * 0.4,
        platform.width + 4, 8,
        0x00ff88, glowAlpha
      );
      this.frameGroup.add(aura);
      return;
    }

    if (platform.type === 'stairs') {
      const steps = Math.floor(platform.height / 12);
      const stepWidth = platform.width / steps;
      const stepHeight = platform.height / steps;
      const goesRight = platform.stairDirection !== 'left';

      for (let i = 0; i < steps; i++) {
        const stepX = goesRight
          ? platform.x + i * stepWidth
          : platform.x + platform.width - (i + 1) * stepWidth;
        const stepY = platform.y + platform.height - (i + 1) * stepHeight;
        const step = this.createBox(
          stepX, stepY, Z_PLATFORMS,
          stepWidth + 1, (i + 1) * stepHeight, depth * 0.8,
          0x2a1a2a
        );
        this.frameGroup.add(step);

        // Step highlight
        const highlight = this.createBox(
          stepX, stepY, Z_PLATFORMS + depth * 0.4,
          stepWidth + 1, 3, 2,
          0x3a2a3a
        );
        this.frameGroup.add(highlight);
      }
      return;
    }

    // Solid platform - 3D box with depth
    const main = this.createBox(
      platform.x, platform.y, Z_PLATFORMS,
      platform.width, platform.height, depth,
      0x1a0a1a
    );
    this.frameGroup.add(main);

    // Top edge highlight - slightly forward
    const topEdge = this.createBox(
      platform.x, platform.y, Z_PLATFORMS + depth / 2 + 1,
      platform.width, 3, 2,
      0x3a1a3a
    );
    this.frameGroup.add(topEdge);

    // Stone texture - bricks on the front face
    for (let bx = 0; bx < platform.width; bx += 24) {
      for (let by = 4; by < platform.height; by += 12) {
        const offset = (by / 12) % 2 === 0 ? 0 : 12;
        const brick = this.createPlane(
          platform.x + bx + offset, platform.y + by,
          Z_PLATFORMS + depth / 2 + 0.5,
          Math.min(22, platform.width - bx - offset), 10,
          0x220a22
        );
        this.frameGroup.add(brick);
      }
    }

    // Neon accent line
    const neon = this.createPlane(
      platform.x, platform.y,
      Z_PLATFORMS + depth / 2 + 1.5,
      platform.width, 1,
      0xff00ff, 0.2
    );
    this.frameGroup.add(neon);
  }

  drawDecoration(decoration: Decoration, _camera: Camera): void {
    switch (decoration.type) {
      case 'pillar':
        this.drawPillar3D(decoration);
        break;
      case 'window':
        this.drawWindow3D(decoration);
        break;
      case 'torch':
        this.drawTorch3D(decoration);
        break;
      case 'arch':
        this.drawArch3D(decoration);
        break;
      case 'cross':
        this.drawCross3D(decoration);
        break;
      case 'banner':
        this.drawBanner3D(decoration);
        break;
    }
  }

  private drawPillar3D(d: Decoration): void {
    // Main pillar body - 3D cylinder-like box with real depth
    const pillarDepth = 50;
    const main = this.createBox(
      d.x + 2, d.y, Z_DECORATIONS,
      d.width - 4, d.height, pillarDepth,
      0x2a1a2a
    );
    this.frameGroup.add(main);

    // Bright edge for highlight
    const edge = this.createBox(
      d.x + 4, d.y, Z_DECORATIONS + pillarDepth / 2 + 1,
      2, d.height, 2,
      0x3a2a3a
    );
    this.frameGroup.add(edge);

    // Capital (top ornament) - wider, forward
    const capital = this.createBox(
      d.x - 4, d.y, Z_DECORATIONS + 2,
      d.width + 8, 8, pillarDepth + 10,
      0x2a1a2a
    );
    this.frameGroup.add(capital);

    const capitalLower = this.createBox(
      d.x - 2, d.y + 8, Z_DECORATIONS + 1,
      d.width + 4, 4, pillarDepth + 5,
      0x2a1a2a
    );
    this.frameGroup.add(capitalLower);

    // Base (bottom ornament)
    const base = this.createBox(
      d.x - 4, d.y + d.height - 8, Z_DECORATIONS + 2,
      d.width + 8, 8, pillarDepth + 10,
      0x2a1a2a
    );
    this.frameGroup.add(base);

    const baseLower = this.createBox(
      d.x - 2, d.y + d.height - 12, Z_DECORATIONS + 1,
      d.width + 4, 4, pillarDepth + 5,
      0x2a1a2a
    );
    this.frameGroup.add(baseLower);
  }

  private drawWindow3D(d: Decoration): void {
    // Window frame - recessed into wall (behind)
    const frame = this.createBox(
      d.x, d.y, Z_WINDOWS,
      d.width, d.height, 8,
      0x2a1a2a
    );
    this.frameGroup.add(frame);

    // Glass with animated glow
    const glowIntensity = 0.3 + 0.15 * Math.sin(Date.now() / 2000);
    const glass = this.createPlane(
      d.x + 4, d.y + 4, Z_WINDOWS + 4.5,
      d.width - 8, d.height - 8,
      0x1e0a3c, glowIntensity + 0.4
    );
    this.frameGroup.add(glass);

    // Cross bars
    const vBar = this.createBox(
      d.x + d.width / 2 - 2, d.y + 4, Z_WINDOWS + 5,
      4, d.height - 8, 3,
      0x2a1a2a
    );
    this.frameGroup.add(vBar);

    const hBar = this.createBox(
      d.x + 4, d.y + d.height / 2 - 2, Z_WINDOWS + 5,
      d.width - 8, 4, 3,
      0x2a1a2a
    );
    this.frameGroup.add(hBar);

    // Light rays emanating forward from window
    const rayColor = 0x643296;
    const ray = this.createPlane(
      d.x - 10, d.y, Z_WINDOWS + 6,
      d.width + 20, d.height,
      rayColor, glowIntensity * 0.3
    );
    this.frameGroup.add(ray);
  }

  private drawTorch3D(d: Decoration): void {
    // Bracket
    const bracket = this.createBox(
      d.x + 4, d.y + 16, Z_DECORATIONS + 10,
      4, 20, 6,
      0x4a3a2a
    );
    this.frameGroup.add(bracket);

    const bracketTop = this.createBox(
      d.x, d.y + 14, Z_DECORATIONS + 10,
      12, 4, 6,
      0x4a3a2a
    );
    this.frameGroup.add(bracketTop);

    // Flame - animated
    const flicker = Math.sin(Date.now() / 100) * 2;
    const flame1 = this.createPlane(
      d.x + 2 + flicker, d.y + 4, Z_DECORATIONS + 12,
      8, 10, 0xff6600
    );
    this.frameGroup.add(flame1);

    const flame2 = this.createPlane(
      d.x + 3 + flicker, d.y + 6, Z_DECORATIONS + 13,
      6, 6, 0xffaa00
    );
    this.frameGroup.add(flame2);

    const flame3 = this.createPlane(
      d.x + 4 + flicker, d.y + 8, Z_DECORATIONS + 14,
      4, 3, 0xffff00
    );
    this.frameGroup.add(flame3);

    // Point light for torch glow (reuse or create)
    // Note: we add a glow plane instead of actual point lights for performance
    const glow = this.createPlane(
      d.x - 20, d.y - 10, Z_DECORATIONS + 8,
      52, 50,
      0xff6400, 0.08
    );
    this.frameGroup.add(glow);
  }

  private drawArch3D(d: Decoration): void {
    const archDepth = 30;
    // Left column
    const leftCol = this.createBox(
      d.x, d.y + 20, Z_DECORATIONS,
      8, d.height - 20, archDepth,
      0x2a1a2a
    );
    this.frameGroup.add(leftCol);

    // Right column
    const rightCol = this.createBox(
      d.x + d.width - 8, d.y + 20, Z_DECORATIONS,
      8, d.height - 20, archDepth,
      0x2a1a2a
    );
    this.frameGroup.add(rightCol);

    // Arch top (simplified as a wide box)
    const archTop = this.createBox(
      d.x, d.y, Z_DECORATIONS,
      d.width, 24, archDepth,
      0x2a1a2a
    );
    this.frameGroup.add(archTop);
  }

  private drawCross3D(d: Decoration): void {
    const crossDepth = 15;
    // Vertical beam
    const vert = this.createBox(
      d.x + d.width / 2 - 3, d.y, Z_DECORATIONS + 5,
      6, d.height, crossDepth,
      0x3a1a1a
    );
    this.frameGroup.add(vert);

    // Horizontal beam
    const horiz = this.createBox(
      d.x, d.y + d.height * 0.25, Z_DECORATIONS + 5,
      d.width, 6, crossDepth,
      0x3a1a1a
    );
    this.frameGroup.add(horiz);
  }

  private drawBanner3D(d: Decoration): void {
    // Banner fabric
    const banner = this.createPlane(
      d.x, d.y, Z_DECORATIONS + 8,
      d.width, d.height,
      0x4a0a0a
    );
    this.frameGroup.add(banner);

    // Symbol
    const symbol = this.createPlane(
      d.x + d.width / 2 - 6, d.y + d.height / 3,
      Z_DECORATIONS + 9,
      12, 12,
      0xff0066, 0.2
    );
    this.frameGroup.add(symbol);
  }

  drawProjectile(proj: Projectile, _camera: Camera): void {
    const hex = typeof proj.color === 'string'
      ? parseInt(proj.color.replace('#', ''), 16)
      : proj.color;

    // Core
    const core = this.createPlane(
      proj.x, proj.y, Z_PROJECTILES,
      proj.width, proj.height,
      hex
    );
    this.frameGroup.add(core);

    // Glow
    const glow = this.createPlane(
      proj.x - 2, proj.y - 2, Z_PROJECTILES - 0.5,
      proj.width + 4, proj.height + 4,
      hex, 0.4
    );
    this.frameGroup.add(glow);
  }

  drawParticle(particle: Particle, _camera: Camera): void {
    const alpha = Math.max(0, 1 - particle.lifetime / particle.maxLifetime);
    const hex = typeof particle.color === 'string'
      ? parseInt(particle.color.replace('#', ''), 16)
      : particle.color;
    const mesh = this.createPlane(
      particle.x, particle.y, Z_PARTICLES,
      particle.size, particle.size,
      hex, alpha
    );
    this.frameGroup.add(mesh);
  }

  drawBackground(_camera: Camera, levelWidth: number, levelHeight: number): void {
    if (!this.bgInitialized) {
      this.bgInitialized = true;

      // Far background wall
      const bgWall = this.createPlane(
        0, 0, Z_BACKGROUND - 5,
        levelWidth, levelHeight,
        0x0a0008
      );
      this.bgGroup.add(bgWall);

      // Synthwave grid on floor (far background)
      const gridMat = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.08,
        wireframe: true,
      });
      const gridGeo = new THREE.PlaneGeometry(levelWidth, 200, 40, 10);
      const grid = new THREE.Mesh(gridGeo, gridMat);
      grid.position.set(levelWidth / 2, -(levelHeight - 100), Z_BACKGROUND - 3);
      this.bgGroup.add(grid);

      // Stars/particles for synthwave feel
      for (let i = 0; i < 80; i++) {
        const hash = (i * 7919 + 42) % 10000;
        const starX = hash % levelWidth;
        const starY = (hash * 3) % (levelHeight * 0.6);
        const colors = [0xff00ff, 0x00ffff, 0xffffff];
        const color = colors[i % 3];
        const star = this.createPlane(
          starX, starY, Z_BACKGROUND - 2 - (i % 3),
          3, 3,
          color, 0.4
        );
        this.bgGroup.add(star);
      }
    }
  }

  // --- HUD methods (drawn on 2D overlay) ---
  drawText(text: string, x: number, y: number, color: string, size: number = 16): void {
    this.hudCtx.fillStyle = color;
    this.hudCtx.font = `bold ${size}px monospace`;
    this.hudCtx.fillText(text, x, y);
  }

  drawBar(x: number, y: number, width: number, height: number, fillRatio: number, fgColor: string, bgColor: string): void {
    this.hudCtx.fillStyle = bgColor;
    this.hudCtx.fillRect(x, y, width, height);
    this.hudCtx.fillStyle = fgColor;
    this.hudCtx.fillRect(x, y, width * Math.max(0, Math.min(1, fillRatio)), height);
    this.hudCtx.strokeStyle = '#ffffff44';
    this.hudCtx.lineWidth = 1;
    this.hudCtx.strokeRect(x, y, width, height);
  }

  drawScreenRect(x: number, y: number, w: number, h: number, color: string): void {
    this.hudCtx.fillStyle = color;
    this.hudCtx.fillRect(x, y, w, h);
  }

  drawCrosshair(x: number, y: number, _camera: Camera): void {
    // Draw crosshair as a 3D element in the scene
    const radius = 5;

    // Red dot
    const dot = this.createPlane(
      x - radius, y - radius, Z_PARTICLES + 1,
      radius * 2, radius * 2,
      0xff0000
    );
    this.frameGroup.add(dot);

    // Bright center
    const center = this.createPlane(
      x - 1.5, y - 1.5, Z_PARTICLES + 1.5,
      3, 3,
      0xff6666
    );
    this.frameGroup.add(center);
  }

  dispose(): void {
    this.spriteTexCache.forEach(tex => tex.dispose());
    this.spriteTexCache.clear();
    this.threeRenderer.dispose();
  }
}
