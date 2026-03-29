import { Camera, Particle, Projectile, GameState } from './types';
import { GameLoop } from './engine/GameLoop';
import { Input } from './engine/Input';
import { rectsOverlap } from './engine/Physics';
import { Renderer } from './rendering/Renderer';
import { Player } from './entities/Player';
import { Enemy } from './entities/Enemy';
import { createCathedralLevel } from './level/CathedralLevel';
import { AudioManager } from './audio/AudioManager';
import {
  PLAYER_IDLE_RIGHT,
  PLAYER_IDLE_LEFT,
  PLAYER_RUN_RIGHT_1,
  PLAYER_RUN_RIGHT_2,
  PLAYER_JUMP_RIGHT,
  DEMON_SPRITE,
  KNIGHT_SPRITE,
  FIEND_SPRITE,
} from './rendering/sprites';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input: Input;
  private gameLoop: GameLoop;
  private audio: AudioManager;

  private player: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private camera: Camera;
  private gameState: GameState;
  private restartListenerBound: boolean = false;
  private restartListener: ((e: KeyboardEvent) => void) | null = null;
  private startMusicListener: (() => void) | null = null;

  private level = createCathedralLevel();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new Input();
    this.audio = new AudioManager();

    // Initialize player at spawn point
    this.player = new Player(this.level.spawnPoint.x, this.level.spawnPoint.y);

    // Give player some starting guns for variety
    this.player.addGun('shotgun');
    this.player.addGun('railgun');

    // Initialize camera
    this.camera = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      targetX: 0,
      targetY: 0,
      shakeAmount: 0,
      shakeTimer: 0,
    };

    // Initialize game state
    this.gameState = {
      running: true,
      score: 0,
      time: 0,
      enemiesKilled: 0,
    };

    // Spawn enemies
    this.spawnEnemies();

    // Create game loop
    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render()
    );
  }

  private spawnEnemies(): void {
    this.enemies = this.level.enemySpawns.map(
      (spawn) => new Enemy(spawn.x, spawn.y, spawn.type, spawn.patrolRange)
    );
  }

  start(): void {
    this.gameLoop.start();
    // Start music on first user interaction (browser policy)
    this.startMusicListener = () => {
      this.audio.startMusic();
      window.removeEventListener('keydown', this.startMusicListener!);
      window.removeEventListener('click', this.startMusicListener!);
      this.startMusicListener = null;
    };
    window.addEventListener('keydown', this.startMusicListener);
    window.addEventListener('click', this.startMusicListener);
  }

  stop(): void {
    this.gameLoop.stop();
    if (this.startMusicListener) {
      window.removeEventListener('keydown', this.startMusicListener);
      window.removeEventListener('click', this.startMusicListener);
      this.startMusicListener = null;
    }
    if (this.restartListener) {
      window.removeEventListener('keydown', this.restartListener);
      this.restartListener = null;
      this.restartListenerBound = false;
    }
    this.audio.stopMusic();
    this.input.destroy();
    this.audio.destroy();
  }

  private update(dt: number): void {
    if (!this.gameState.running) return;

    this.gameState.time += dt;
    const inputState = this.input.getState();

    // Update player
    const playerResult = this.player.update(dt, inputState, this.level.platforms);
    this.projectiles.push(...playerResult.projectiles);
    this.particles.push(...playerResult.particles);

    if (playerResult.projectiles.length > 0) {
      this.audio.playShoot();
    }

    // Check for jump pad sound
    if (playerResult.particles.some(p => p.color === '#00ff88')) {
      this.audio.playJumpPad();
    }

    // Update enemies
    for (const enemy of this.enemies) {
      const enemyResult = enemy.update(
        dt,
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        this.level.platforms
      );
      this.projectiles.push(...enemyResult.projectiles);
      this.particles.push(...enemyResult.particles);
    }

    // Update projectiles
    this.updateProjectiles(dt);

    // Update particles
    this.updateParticles(dt);

    // Update camera
    this.updateCamera();

    // Update camera shake
    if (this.camera.shakeTimer > 0) {
      this.camera.shakeTimer -= dt;
      if (this.camera.shakeTimer <= 0) {
        this.camera.shakeAmount = 0;
      }
    }

    // Remove dead enemies that have faded out
    this.enemies = this.enemies.filter(e => !e.shouldRemove());

    // Check player death
    if (!this.player.isAlive()) {
      this.gameState.running = false;
    }

    // Update input state (for just-pressed detection)
    this.input.update();
  }

  private updateProjectiles(dt: number): void {
    const toRemove: number[] = [];

    for (let i = 0; i < this.projectiles.length; i++) {
      const proj = this.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.lifetime += dt;

      if (proj.lifetime > proj.maxLifetime) {
        toRemove.push(i);
        continue;
      }

      // Check collision with platforms
      let hitPlatform = false;
      for (const platform of this.level.platforms) {
        if (platform.type === 'jumppad') continue;
        if (rectsOverlap(
          { x: proj.x, y: proj.y, width: proj.width, height: proj.height },
          { x: platform.x, y: platform.y, width: platform.width, height: platform.height }
        )) {
          hitPlatform = true;
          break;
        }
      }

      if (hitPlatform) {
        toRemove.push(i);
        // Wall impact particles
        for (let p = 0; p < 3; p++) {
          this.particles.push({
            x: proj.x,
            y: proj.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: proj.color,
            size: 2,
            lifetime: 0,
            maxLifetime: 200,
            gravity: false,
          });
        }
        continue;
      }

      if (proj.fromPlayer) {
        // Check collision with enemies
        for (const enemy of this.enemies) {
          if (enemy.isDead()) continue;
          if (rectsOverlap(
            { x: proj.x, y: proj.y, width: proj.width, height: proj.height },
            { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
          )) {
            toRemove.push(i);
            const deathParticles = enemy.takeDamage(proj.damage);
            this.particles.push(...deathParticles);

            if (enemy.isDead()) {
              this.gameState.score += 100;
              this.gameState.enemiesKilled++;
              this.audio.playExplosion();
              this.shakeCamera(4, 200);
            } else {
              this.audio.playHit();
            }
            break;
          }
        }
      } else {
        // Check collision with player
        if (this.player.invincibleTimer <= 0 && rectsOverlap(
          { x: proj.x, y: proj.y, width: proj.width, height: proj.height },
          { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height }
        )) {
          toRemove.push(i);
          const hurtParticles = this.player.takeDamage(proj.damage);
          this.particles.push(...hurtParticles);
          this.audio.playPlayerHurt();
          this.shakeCamera(6, 300);
        }
      }
    }

    // Remove projectiles in reverse order to keep indices valid
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.projectiles.splice(toRemove[i], 1);
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.lifetime += dt;

      if (p.gravity) {
        p.vy += 0.2;
      }

      if (p.lifetime >= p.maxLifetime) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateCamera(): void {
    // Follow player with smooth lerp
    this.camera.targetX = this.player.x + this.player.width / 2 - this.camera.width / 2;
    this.camera.targetY = this.player.y + this.player.height / 2 - this.camera.height / 2;

    // Bias camera slightly ahead in movement direction
    if (this.player.direction === 'right') {
      this.camera.targetX += 100;
    } else {
      this.camera.targetX -= 100;
    }

    // Smooth follow
    this.camera.x += (this.camera.targetX - this.camera.x) * 0.08;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.08;

    // Clamp camera to level bounds
    this.camera.x = Math.max(0, Math.min(this.level.width - this.camera.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.level.height - this.camera.height, this.camera.y));
  }

  private shakeCamera(amount: number, duration: number): void {
    this.camera.shakeAmount = amount;
    this.camera.shakeTimer = duration;
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.beginFrame(this.camera);

    // Background
    this.renderer.drawBackground(this.camera, this.level.width, this.level.height);

    // Decorations (behind everything)
    for (const decoration of this.level.decorations) {
      this.renderer.drawDecoration(decoration, this.camera);
    }

    // Platforms
    for (const platform of this.level.platforms) {
      this.renderer.drawPlatform(platform, this.camera);
    }

    // Enemies
    for (const enemy of this.enemies) {
      if (enemy.isDead()) {
        // Flash on death
        if (enemy.deathTimer < 500) {
          const alpha = 1 - enemy.deathTimer / 500;
          this.renderer.drawRect(
            enemy.x, enemy.y, enemy.width, enemy.height,
            `rgba(255, 100, 0, ${alpha})`,
            this.camera
          );
        }
      } else {
        this.renderEnemy(enemy);
      }
    }

    // Player
    this.renderPlayer();

    // Projectiles
    for (const proj of this.projectiles) {
      this.renderer.drawProjectile(proj, this.camera);
    }

    // Particles
    for (const particle of this.particles) {
      this.renderer.drawParticle(particle, this.camera);
    }

    // HUD
    this.renderHUD();

    // Game over screen
    if (!this.gameState.running) {
      this.renderGameOver();
    }
  }

  private renderPlayer(): void {
    // Invincibility blink
    if (this.player.invincibleTimer > 0 && Math.floor(this.player.invincibleTimer / 100) % 2 === 0) {
      return; // Skip rendering for blink effect
    }

    let sprite = PLAYER_IDLE_RIGHT;

    if (this.player.direction === 'right') {
      switch (this.player.state) {
        case 'idle':
          sprite = PLAYER_IDLE_RIGHT;
          break;
        case 'running':
          sprite = this.player.animFrame === 0 ? PLAYER_RUN_RIGHT_1 : PLAYER_RUN_RIGHT_2;
          break;
        case 'jumping':
        case 'falling':
          sprite = PLAYER_JUMP_RIGHT;
          break;
        default:
          sprite = PLAYER_IDLE_RIGHT;
      }
    } else {
      // For left-facing, use mirrored sprites
      switch (this.player.state) {
        case 'idle':
          sprite = PLAYER_IDLE_LEFT;
          break;
        case 'running':
          sprite = this.player.animFrame === 0 ? PLAYER_RUN_RIGHT_1 : PLAYER_RUN_RIGHT_2;
          // Mirror by rendering backwards
          sprite = this.mirrorSprite(sprite);
          break;
        case 'jumping':
        case 'falling':
          sprite = this.mirrorSprite(PLAYER_JUMP_RIGHT);
          break;
        default:
          sprite = PLAYER_IDLE_LEFT;
      }
    }

    this.renderer.drawSprite(sprite, this.player.x, this.player.y, this.camera);
  }

  private mirrorSprite(sprite: typeof PLAYER_IDLE_RIGHT): typeof PLAYER_IDLE_RIGHT {
    return {
      width: sprite.width,
      height: sprite.height,
      pixels: sprite.pixels.map(row => [...row].reverse()),
    };
  }

  private renderEnemy(enemy: Enemy): void {
    let sprite;
    switch (enemy.type) {
      case 'demon':
        sprite = DEMON_SPRITE;
        break;
      case 'knight':
        sprite = KNIGHT_SPRITE;
        break;
      case 'fiend':
        sprite = FIEND_SPRITE;
        break;
    }

    // Mirror if facing left
    if (enemy.direction === 'left') {
      sprite = this.mirrorSprite(sprite);
    }

    // Flash white on hurt
    if (enemy.state === 'hurt') {
      this.renderer.drawRect(
        enemy.x, enemy.y, enemy.width, enemy.height,
        '#ffffff88',
        this.camera
      );
    }

    this.renderer.drawSprite(sprite, enemy.x, enemy.y, this.camera);

    // Health bar above enemy
    const healthRatio = enemy.health / enemy.maxHealth;
    if (healthRatio < 1) {
      const barWidth = enemy.width;
      const barX = enemy.x;
      const barY = enemy.y - 8;
      this.renderer.drawRect(barX, barY, barWidth, 4, '#440000', this.camera);
      this.renderer.drawRect(barX, barY, barWidth * healthRatio, 4, '#cc0000', this.camera);
    }
  }

  private renderHUD(): void {
    // Background panel
    this.renderer.drawScreenRect(8, 8, 260, 70, 'rgba(0, 0, 0, 0.6)');

    // Health bar
    this.renderer.drawText('HP', 14, 30, '#ff4444', 14);
    this.renderer.drawBar(
      40, 18, 120, 14,
      this.player.health / this.player.maxHealth,
      '#cc0000',
      '#440000'
    );
    this.renderer.drawText(`${Math.max(0, this.player.health)}`, 166, 30, '#ff6666', 12);

    // Current weapon
    this.renderer.drawText(
      `GUN: ${this.player.currentGun.name}`,
      14, 50,
      this.player.currentGun.projectileColor,
      12
    );

    // Score
    this.renderer.drawText(`SCORE: ${this.gameState.score}`, 14, 68, '#ffaa00', 12);

    // Enemies killed
    this.renderer.drawText(
      `KILLS: ${this.gameState.enemiesKilled}`,
      140, 68,
      '#ff6600', 12
    );

    // Controls help (bottom of screen)
    this.renderer.drawText(
      'A/D: Move  W/SPACE: Jump  X: Shoot  Q: Switch Gun',
      this.renderer.width / 2 - 220, this.renderer.height - 14,
      '#ffffff44', 11
    );
  }

  private renderGameOver(): void {
    // Dark overlay
    this.renderer.drawScreenRect(0, 0, this.renderer.width, this.renderer.height, 'rgba(0, 0, 0, 0.7)');

    // Game over text
    this.renderer.drawText(
      'GAME OVER',
      this.renderer.width / 2 - 80,
      this.renderer.height / 2 - 20,
      '#ff0044',
      32
    );

    this.renderer.drawText(
      `Final Score: ${this.gameState.score}`,
      this.renderer.width / 2 - 70,
      this.renderer.height / 2 + 20,
      '#ffaa00',
      16
    );

    this.renderer.drawText(
      `Enemies Killed: ${this.gameState.enemiesKilled}`,
      this.renderer.width / 2 - 80,
      this.renderer.height / 2 + 45,
      '#ff6600',
      14
    );

    this.renderer.drawText(
      'Press R to Restart',
      this.renderer.width / 2 - 70,
      this.renderer.height / 2 + 80,
      '#ffffff88',
      14
    );

    // Listen for restart (only bind once to avoid listener leak)
    if (!this.restartListenerBound) {
      this.restartListenerBound = true;
      this.restartListener = (e: KeyboardEvent) => {
        if (e.code === 'KeyR') {
          window.removeEventListener('keydown', this.restartListener!);
          this.restartListener = null;
          this.restartListenerBound = false;
          this.restart();
        }
      };
      window.addEventListener('keydown', this.restartListener);
    }
  }

  private restart(): void {
    this.player = new Player(this.level.spawnPoint.x, this.level.spawnPoint.y);
    this.player.addGun('shotgun');
    this.player.addGun('railgun');
    this.projectiles = [];
    this.particles = [];
    this.spawnEnemies();
    this.restartListenerBound = false;
    this.gameState = {
      running: true,
      score: 0,
      time: 0,
      enemiesKilled: 0,
    };
  }
}
