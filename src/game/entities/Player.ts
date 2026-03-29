import { Direction, InputState, Platform, PlayerState, Projectile, Gun, GunType, Particle } from '../types';
import { GRAVITY, MAX_FALL_SPEED, FRICTION, resolveCollisionX, resolveCollisionY } from '../engine/Physics';
import { GUNS } from './Guns';

const PLAYER_SPEED = 4.5;
const JUMP_FORCE = -12;
const PLAYER_WIDTH = 64; // 16 pixels * 4 scale (3D)
const PLAYER_HEIGHT = 80; // 20 pixels * 4 scale (3D)
const MAX_HEALTH = 100;

export class Player {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  width: number = PLAYER_WIDTH;
  height: number = PLAYER_HEIGHT;
  direction: Direction = 'right';
  state: PlayerState = 'idle';
  onGround: boolean = false;
  health: number = MAX_HEALTH;
  maxHealth: number = MAX_HEALTH;
  score: number = 0;

  // Weapons
  guns: Gun[] = [GUNS.blaster];
  currentGunIndex: number = 0;
  lastFireTime: number = 0;

  // Animation
  animTimer: number = 0;
  animFrame: number = 0;

  // Invincibility after being hit
  invincibleTimer: number = 0;

  // Jump tracking for preventing air jumps
  private jumpHeld: boolean = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get currentGun(): Gun {
    return this.guns[this.currentGunIndex];
  }

  update(dt: number, input: InputState, platforms: Platform[]): { projectiles: Projectile[]; particles: Particle[] } {
    const newProjectiles: Projectile[] = [];
    const newParticles: Particle[] = [];

    // Handle invincibility
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }

    // Horizontal movement
    if (input.left) {
      this.vx = -PLAYER_SPEED;
      this.direction = 'left';
    } else if (input.right) {
      this.vx = PLAYER_SPEED;
      this.direction = 'right';
    } else {
      this.vx *= FRICTION;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // Jump
    if (input.jump && this.onGround && !this.jumpHeld) {
      this.vy = JUMP_FORCE;
      this.onGround = false;
      this.jumpHeld = true;
    }
    if (!input.jump) {
      this.jumpHeld = false;
      // Variable jump height - cut velocity if released early
      if (this.vy < JUMP_FORCE / 2) {
        this.vy = JUMP_FORCE / 2;
      }
    }

    // Apply gravity
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

    // Move and collide X
    this.x += this.vx;
    const xResult = resolveCollisionX(
      { x: this.x, y: this.y, width: this.width, height: this.height },
      this.vx,
      platforms
    );
    this.x = xResult.x;
    this.vx = xResult.vx;

    // Move and collide Y
    this.y += this.vy;
    const yResult = resolveCollisionY(
      { x: this.x, y: this.y, width: this.width, height: this.height },
      this.vy,
      platforms
    );
    this.y = yResult.y;
    this.vy = yResult.vy;
    this.onGround = yResult.onGround;

    // Handle jump pads
    if (yResult.onJumpPad) {
      this.vy = -yResult.jumpForce;
      this.onGround = false;
      // Jump pad particles
      for (let i = 0; i < 8; i++) {
        newParticles.push({
          x: this.x + this.width / 2 + (Math.random() - 0.5) * 20,
          y: this.y + this.height,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 5 - 2,
          color: '#00ff88',
          size: 3,
          lifetime: 0,
          maxLifetime: 400,
          gravity: true,
        });
      }
    }

    // Switch weapon
    if (input.switchWeapon && this.guns.length > 1) {
      this.currentGunIndex = (this.currentGunIndex + 1) % this.guns.length;
    }

    // Update facing direction based on aim while shooting
    if (input.shoot) {
      this.direction = Math.cos(input.aimAngle) >= 0 ? 'right' : 'left';
    }

    // Shooting
    const now = Date.now();
    if (input.shoot && now - this.lastFireTime > this.currentGun.fireRate) {
      this.lastFireTime = now;
      const gun = this.currentGun;
      const aimAngle = input.aimAngle;
      const cosAim = Math.cos(aimAngle);
      const sinAim = Math.sin(aimAngle);

      for (let i = 0; i < gun.projectilesPerShot; i++) {
        const spread = (Math.random() - 0.5) * gun.spread;
        const angle = aimAngle + spread;
        const speed = gun.projectileSpeed;
        newProjectiles.push({
          x: this.x + this.width / 2 + cosAim * 16 - 4,
          y: this.y + this.height / 2 + sinAim * 16 - 2,
          vx: speed * Math.cos(angle),
          vy: speed * Math.sin(angle),
          damage: gun.damage,
          color: gun.projectileColor,
          width: 8,
          height: 4,
          fromPlayer: true,
          lifetime: 0,
          maxLifetime: 2000,
        });
      }

      // Muzzle flash particles
      for (let i = 0; i < 4; i++) {
        newParticles.push({
          x: this.x + this.width / 2 + cosAim * 18,
          y: this.y + this.height / 2 + sinAim * 18 + (Math.random() - 0.5) * 6,
          vx: cosAim * (Math.random() * 3 + 1),
          vy: sinAim * (Math.random() * 3 + 1) + (Math.random() - 0.5) * 2,
          color: gun.projectileColor,
          size: 2 + Math.random() * 2,
          lifetime: 0,
          maxLifetime: 150,
          gravity: false,
        });
      }
    }

    // Update state
    if (!this.onGround) {
      this.state = this.vy < 0 ? 'jumping' : 'falling';
    } else if (Math.abs(this.vx) > 0.5) {
      this.state = 'running';
    } else {
      this.state = 'idle';
    }

    // Animation timer
    this.animTimer += dt;
    if (this.animTimer > 150) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    // Keep player in bounds
    if (this.x < 0) this.x = 0;
    if (this.y > 2000) {
      // Fell off the map - respawn
      this.health -= 20;
      this.y = 0;
      this.vy = 0;
    }

    return { projectiles: newProjectiles, particles: newParticles };
  }

  takeDamage(amount: number): Particle[] {
    if (this.invincibleTimer > 0) return [];
    this.health -= amount;
    this.invincibleTimer = 1000; // 1 second of invincibility

    // Blood particles
    const particles: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        color: '#cc0000',
        size: 3,
        lifetime: 0,
        maxLifetime: 500,
        gravity: true,
      });
    }
    return particles;
  }

  addGun(type: GunType): void {
    if (!this.guns.find(g => g.type === type)) {
      this.guns.push(GUNS[type]);
      this.currentGunIndex = this.guns.length - 1;
    }
  }

  isAlive(): boolean {
    return this.health > 0;
  }
}
