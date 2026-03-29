import { Camera, Decoration, Platform, Sprite, Particle, Projectile } from '../types';

const PIXEL_SCALE = 3; // each pixel in sprite = 3 screen pixels

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    // Disable image smoothing for pixel art
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(): void {
    this.ctx.fillStyle = '#0a0a12';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  beginFrame(camera: Camera, zoomLevel: number = 1): void {
    this.shakeOffsetX = camera.shakeAmount * (Math.random() - 0.5);
    this.shakeOffsetY = camera.shakeAmount * (Math.random() - 0.5);

    // Apply zoom transform: scale from center of canvas
    if (zoomLevel !== 1) {
      this.ctx.save();
      this.ctx.translate(this.width / 2, this.height / 2);
      this.ctx.scale(zoomLevel, zoomLevel);
      this.ctx.translate(-this.width / 2, -this.height / 2);
    } else {
      this.ctx.save();
    }
  }

  endFrame(): void {
    this.ctx.restore();
  }

  drawSprite(sprite: Sprite, x: number, y: number, camera: Camera, scale: number = PIXEL_SCALE): void {
    const sx = Math.floor(x - camera.x + this.shakeOffsetX);
    const sy = Math.floor(y - camera.y + this.shakeOffsetY);

    for (let py = 0; py < sprite.height; py++) {
      for (let px = 0; px < sprite.width; px++) {
        const color = sprite.pixels[py][px];
        if (color) {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(
            sx + px * scale,
            sy + py * scale,
            scale,
            scale
          );
        }
      }
    }
  }

  drawRect(x: number, y: number, w: number, h: number, color: string, camera: Camera): void {
    const sx = Math.floor(x - camera.x + this.shakeOffsetX);
    const sy = Math.floor(y - camera.y + this.shakeOffsetY);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(sx, sy, w, h);
  }

  drawPlatform(platform: Platform, camera: Camera): void {
    const sx = Math.floor(platform.x - camera.x + this.shakeOffsetX);
    const sy = Math.floor(platform.y - camera.y + this.shakeOffsetY);

    if (platform.type === 'jumppad') {
      // Glowing green jump pad
      this.ctx.fillStyle = '#00aa55';
      this.ctx.fillRect(sx, sy, platform.width, platform.height);
      this.ctx.fillStyle = '#00ff88';
      this.ctx.fillRect(sx + 2, sy, platform.width - 4, 3);
      // Animated glow effect
      const glowAlpha = 0.3 + 0.2 * Math.sin(Date.now() / 200);
      this.ctx.fillStyle = `rgba(0, 255, 136, ${glowAlpha})`;
      this.ctx.fillRect(sx - 2, sy - 8, platform.width + 4, 8);
      return;
    }

    if (platform.type === 'stairs') {
      // Draw stairs as stepped blocks
      const steps = Math.floor(platform.height / 12);
      const stepWidth = platform.width / steps;
      const stepHeight = platform.height / steps;
      const goesRight = platform.stairDirection !== 'left';

      for (let i = 0; i < steps; i++) {
        const stepX = goesRight ? sx + i * stepWidth : sx + platform.width - (i + 1) * stepWidth;
        const stepY = sy + platform.height - (i + 1) * stepHeight;
        this.ctx.fillStyle = '#2a1a2a';
        this.ctx.fillRect(stepX, stepY, stepWidth + 1, (i + 1) * stepHeight);
        this.ctx.fillStyle = '#3a2a3a';
        this.ctx.fillRect(stepX, stepY, stepWidth + 1, 3);
      }
      return;
    }

    // Solid platform - dark stone with synthwave accent
    this.ctx.fillStyle = '#1a0a1a';
    this.ctx.fillRect(sx, sy, platform.width, platform.height);

    // Top edge highlight
    this.ctx.fillStyle = '#3a1a3a';
    this.ctx.fillRect(sx, sy, platform.width, 3);

    // Stone texture pattern
    this.ctx.fillStyle = '#220a22';
    for (let bx = 0; bx < platform.width; bx += 24) {
      for (let by = 4; by < platform.height; by += 12) {
        const offset = (by / 12) % 2 === 0 ? 0 : 12;
        this.ctx.fillRect(sx + bx + offset, sy + by, 22, 10);
      }
    }

    // Neon accent line at top
    this.ctx.fillStyle = '#ff00ff33';
    this.ctx.fillRect(sx, sy, platform.width, 1);
  }

  drawDecoration(decoration: Decoration, camera: Camera): void {
    const sx = Math.floor(decoration.x - camera.x + this.shakeOffsetX);
    const sy = Math.floor(decoration.y - camera.y + this.shakeOffsetY);

    switch (decoration.type) {
      case 'pillar':
        this.drawPillar(sx, sy, decoration.width, decoration.height);
        break;
      case 'window':
        this.drawWindow(sx, sy, decoration.width, decoration.height);
        break;
      case 'torch':
        this.drawTorchDecoration(sx, sy);
        break;
      case 'arch':
        this.drawArch(sx, sy, decoration.width, decoration.height);
        break;
      case 'cross':
        this.drawCross(sx, sy, decoration.width, decoration.height);
        break;
      case 'banner':
        this.drawBanner(sx, sy, decoration.width, decoration.height);
        break;
    }
  }

  private drawPillar(sx: number, sy: number, w: number, h: number): void {
    // Base
    this.ctx.fillStyle = '#1a0a1a';
    this.ctx.fillRect(sx, sy, w, h);
    // Highlight
    this.ctx.fillStyle = '#2a1a2a';
    this.ctx.fillRect(sx + 2, sy, w - 4, h);
    // Bright edge
    this.ctx.fillStyle = '#3a2a3a';
    this.ctx.fillRect(sx + 4, sy, 2, h);
    // Capital top
    this.ctx.fillStyle = '#2a1a2a';
    this.ctx.fillRect(sx - 4, sy, w + 8, 8);
    this.ctx.fillRect(sx - 2, sy + 8, w + 4, 4);
    // Base bottom
    this.ctx.fillRect(sx - 4, sy + h - 8, w + 8, 8);
    this.ctx.fillRect(sx - 2, sy + h - 12, w + 4, 4);
  }

  private drawWindow(sx: number, sy: number, w: number, h: number): void {
    // Frame
    this.ctx.fillStyle = '#2a1a2a';
    this.ctx.fillRect(sx, sy, w, h);
    // Glass with dark blue glow
    const glowIntensity = 0.3 + 0.15 * Math.sin(Date.now() / 2000);
    this.ctx.fillStyle = `rgba(30, 10, 60, ${glowIntensity + 0.4})`;
    this.ctx.fillRect(sx + 4, sy + 4, w - 8, h - 8);
    // Light rays
    this.ctx.fillStyle = `rgba(100, 50, 150, ${glowIntensity})`;
    this.ctx.fillRect(sx + w / 2 - 2, sy + 4, 4, h - 8);
    this.ctx.fillRect(sx + 4, sy + h / 2 - 2, w - 8, 4);
    // Pointed arch top
    this.ctx.fillStyle = '#2a1a2a';
    this.ctx.beginPath();
    this.ctx.moveTo(sx, sy + 20);
    this.ctx.lineTo(sx + w / 2, sy);
    this.ctx.lineTo(sx + w, sy + 20);
    this.ctx.fill();
  }

  private drawTorchDecoration(sx: number, sy: number): void {
    // Bracket
    this.ctx.fillStyle = '#4a3a2a';
    this.ctx.fillRect(sx + 4, sy + 16, 4, 20);
    this.ctx.fillRect(sx, sy + 14, 12, 4);
    // Flame - animated
    const flicker = Math.sin(Date.now() / 100) * 2;
    this.ctx.fillStyle = '#ff6600';
    this.ctx.fillRect(sx + 2 + flicker, sy + 4, 8, 10);
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.fillRect(sx + 3 + flicker, sy + 6, 6, 6);
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillRect(sx + 4 + flicker, sy + 8, 4, 3);
    // Glow
    this.ctx.fillStyle = 'rgba(255, 100, 0, 0.1)';
    this.ctx.fillRect(sx - 20, sy - 10, 52, 50);
  }

  private drawArch(sx: number, sy: number, w: number, h: number): void {
    this.ctx.fillStyle = '#2a1a2a';
    // Left column
    this.ctx.fillRect(sx, sy + 20, 8, h - 20);
    // Right column
    this.ctx.fillRect(sx + w - 8, sy + 20, 8, h - 20);
    // Arch curve
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#2a1a2a';
    this.ctx.lineWidth = 8;
    this.ctx.arc(sx + w / 2, sy + 20, w / 2 - 4, Math.PI, 0);
    this.ctx.stroke();
  }

  private drawCross(sx: number, sy: number, w: number, h: number): void {
    this.ctx.fillStyle = '#3a1a1a';
    // Vertical
    this.ctx.fillRect(sx + w / 2 - 3, sy, 6, h);
    // Horizontal
    this.ctx.fillRect(sx, sy + h * 0.25, w, 6);
  }

  private drawBanner(sx: number, sy: number, w: number, h: number): void {
    // Dark red banner
    this.ctx.fillStyle = '#4a0a0a';
    this.ctx.fillRect(sx, sy, w, h);
    // Torn bottom edge
    for (let i = 0; i < w; i += 6) {
      const tearH = Math.sin(i * 0.5) * 4 + 4;
      this.ctx.fillStyle = '#0a0a12';
      this.ctx.fillRect(sx + i, sy + h - tearH, 3, tearH);
    }
    // Symbol (simple pentagram-like shape)
    this.ctx.fillStyle = '#ff006633';
    this.ctx.fillRect(sx + w / 2 - 6, sy + h / 3, 12, 12);
  }

  drawProjectile(proj: Projectile, camera: Camera): void {
    const sx = Math.floor(proj.x - camera.x + this.shakeOffsetX);
    const sy = Math.floor(proj.y - camera.y + this.shakeOffsetY);
    // Core
    this.ctx.fillStyle = proj.color;
    this.ctx.fillRect(sx, sy, proj.width, proj.height);
    // Glow
    this.ctx.fillStyle = proj.color + '66';
    this.ctx.fillRect(sx - 2, sy - 2, proj.width + 4, proj.height + 4);
  }

  drawParticle(particle: Particle, camera: Camera): void {
    const sx = Math.floor(particle.x - camera.x + this.shakeOffsetX);
    const sy = Math.floor(particle.y - camera.y + this.shakeOffsetY);
    const alpha = 1 - particle.lifetime / particle.maxLifetime;
    this.ctx.globalAlpha = Math.max(0, alpha);
    this.ctx.fillStyle = particle.color;
    this.ctx.fillRect(sx, sy, particle.size, particle.size);
    this.ctx.globalAlpha = 1;
  }

  drawBackground(camera: Camera, levelWidth: number, levelHeight: number): void {
    // Dark gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0a0008');
    gradient.addColorStop(0.5, '#0a0a12');
    gradient.addColorStop(1, '#1a0a1a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Parallax stars/particles for synthwave feel
    const starSeed = 42;
    for (let i = 0; i < 60; i++) {
      const hash = (i * 7919 + starSeed) % 10000;
      const starX = (hash % levelWidth) - camera.x * 0.3;
      const starY = ((hash * 3) % (levelHeight * 0.6)) - camera.y * 0.2;
      const blink = Math.sin(Date.now() / 1000 + i) * 0.3 + 0.7;
      this.ctx.globalAlpha = blink * 0.5;
      this.ctx.fillStyle = i % 3 === 0 ? '#ff00ff' : i % 3 === 1 ? '#00ffff' : '#ffffff';
      this.ctx.fillRect(starX % this.width, starY % this.height, 2, 2);
    }
    this.ctx.globalAlpha = 1;

    // Synthwave grid on floor (far background)
    this.drawSynthwaveGrid(camera, levelHeight);
  }

  private drawSynthwaveGrid(camera: Camera, levelHeight: number): void {
    const gridY = levelHeight - camera.y * 0.5;
    if (gridY > this.height + 100) return;

    this.ctx.strokeStyle = '#ff00ff22';
    this.ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i < 10; i++) {
      const y = gridY + i * 20;
      if (y > 0 && y < this.height) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.width, y);
        this.ctx.stroke();
      }
    }

    // Vertical lines (perspective)
    for (let i = -10; i < 20; i++) {
      const x = (this.width / 2) + i * 60 - (camera.x * 0.1) % 60;
      this.ctx.beginPath();
      this.ctx.moveTo(x, gridY);
      this.ctx.lineTo(x + (x - this.width / 2) * 0.5, gridY + 200);
      this.ctx.stroke();
    }
  }

  // HUD methods (screen-space, not affected by camera)
  drawText(text: string, x: number, y: number, color: string, size: number = 16): void {
    this.ctx.fillStyle = color;
    this.ctx.font = `bold ${size}px monospace`;
    this.ctx.fillText(text, x, y);
  }

  drawBar(x: number, y: number, width: number, height: number, fillRatio: number, fgColor: string, bgColor: string): void {
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(x, y, width, height);
    this.ctx.fillStyle = fgColor;
    this.ctx.fillRect(x, y, width * Math.max(0, Math.min(1, fillRatio)), height);
    // Border
    this.ctx.strokeStyle = '#ffffff44';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
  }

  drawScreenRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  drawCrosshair(x: number, y: number, camera: Camera): void {
    const sx = Math.floor(x - camera.x + this.shakeOffsetX);
    const sy = Math.floor(y - camera.y + this.shakeOffsetY);
    const radius = 4;

    // Outer ring
    this.ctx.beginPath();
    this.ctx.arc(sx, sy, radius + 2, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Red dot
    this.ctx.beginPath();
    this.ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fill();

    // Bright center
    this.ctx.beginPath();
    this.ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ff6666';
    this.ctx.fill();
  }
}
