import { Direction, EnemyState, EnemyType, Particle, Platform, Projectile } from '../types';
import { GRAVITY, MAX_FALL_SPEED, resolveCollisionX, resolveCollisionY } from '../engine/Physics';

const ENEMY_CONFIGS: Record<EnemyType, {
  width: number;
  height: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  attackDamage: number;
  chaseRange: number;
  color: string;
}> = {
  demon: {
    width: 21, // 7 * 3
    height: 30, // 10 * 3
    speed: 2,
    attackRange: 60,
    attackCooldown: 1500,
    attackDamage: 8,
    chaseRange: 300,
    color: '#cc0000',
  },
  knight: {
    width: 21,
    height: 30,
    speed: 1.5,
    attackRange: 80,
    attackCooldown: 2000,
    attackDamage: 12,
    chaseRange: 250,
    color: '#aaaaaa',
  },
  fiend: {
    width: 24, // 8 * 3
    height: 30,
    speed: 3.5,
    attackRange: 120,
    attackCooldown: 2500,
    attackDamage: 15,
    chaseRange: 400,
    color: '#553300',
  },
};

export class Enemy {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  width: number;
  height: number;
  type: EnemyType;
  state: EnemyState = 'patrol';
  direction: Direction = 'left';
  health: number;
  maxHealth: number;
  onGround: boolean = false;

  private config: typeof ENEMY_CONFIGS['demon'];
  private patrolOriginX: number;
  private patrolRange: number;
  private attackTimer: number = 0;
  private hurtTimer: number = 0;
  deathTimer: number = 0;
  private stateTimer: number = 0;

  constructor(x: number, y: number, type: EnemyType, patrolRange: number) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.config = ENEMY_CONFIGS[type];
    this.width = this.config.width;
    this.height = this.config.height;
    this.patrolOriginX = x;
    this.patrolRange = patrolRange;

    // Random HP up to 20
    this.maxHealth = Math.floor(Math.random() * 18) + 3;
    this.health = this.maxHealth;
  }

  update(
    dt: number,
    playerX: number,
    playerY: number,
    platforms: Platform[]
  ): { projectiles: Projectile[]; particles: Particle[] } {
    const newProjectiles: Projectile[] = [];
    const newParticles: Particle[] = [];

    if (this.state === 'dead') {
      this.deathTimer += dt;
      return { projectiles: newProjectiles, particles: newParticles };
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) {
        this.state = 'chase';
      }
      return { projectiles: newProjectiles, particles: newParticles };
    }

    this.stateTimer += dt;
    this.attackTimer -= dt;

    // Calculate distance to player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);

    // State machine
    if (distToPlayer < this.config.chaseRange) {
      if (distToPlayer < this.config.attackRange && this.attackTimer <= 0) {
        this.state = 'attack';
        this.attackTimer = this.config.attackCooldown;
        this.direction = dx > 0 ? 'right' : 'left';

        // Fire projectile at player
        const dirMul = this.direction === 'right' ? 1 : -1;
        newProjectiles.push({
          x: this.x + (this.direction === 'right' ? this.width : -6),
          y: this.y + this.height / 2 - 3,
          vx: 5 * dirMul,
          vy: 0,
          damage: this.config.attackDamage,
          color: this.config.color,
          width: 6,
          height: 4,
          fromPlayer: false,
          lifetime: 0,
          maxLifetime: 1500,
        });

        // Attack particles
        for (let i = 0; i < 3; i++) {
          newParticles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: dirMul * (Math.random() * 3 + 1),
            vy: (Math.random() - 0.5) * 2,
            color: this.config.color,
            size: 2,
            lifetime: 0,
            maxLifetime: 200,
            gravity: false,
          });
        }
      } else {
        this.state = 'chase';
        this.direction = dx > 0 ? 'right' : 'left';
        this.vx = this.config.speed * (dx > 0 ? 1 : -1);
      }
    } else {
      // Patrol
      this.state = 'patrol';
      if (this.x <= this.patrolOriginX - this.patrolRange) {
        this.direction = 'right';
      } else if (this.x >= this.patrolOriginX + this.patrolRange) {
        this.direction = 'left';
      }
      this.vx = this.config.speed * 0.5 * (this.direction === 'right' ? 1 : -1);
    }

    // Fiend special: jumping attack
    if (this.type === 'fiend' && this.state === 'chase' && this.onGround && distToPlayer < 200) {
      this.vy = -10;
      this.onGround = false;
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

    // Keep enemy from falling off map
    if (this.y > 2000) {
      this.health = 0;
      this.state = 'dead';
    }

    return { projectiles: newProjectiles, particles: newParticles };
  }

  takeDamage(damage: number): Particle[] {
    this.health -= damage;
    const particles: Particle[] = [];

    if (this.health <= 0) {
      this.state = 'dead';
      this.deathTimer = 0;
      // Death explosion particles
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 3,
          color: i % 2 === 0 ? this.config.color : '#ff6600',
          size: 3 + Math.random() * 3,
          lifetime: 0,
          maxLifetime: 600,
          gravity: true,
        });
      }
    } else {
      this.state = 'hurt';
      this.hurtTimer = 200;
      // Hit particles
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5 - 1,
          color: this.config.color,
          size: 2,
          lifetime: 0,
          maxLifetime: 300,
          gravity: true,
        });
      }
    }

    return particles;
  }

  isDead(): boolean {
    return this.state === 'dead';
  }

  shouldRemove(): boolean {
    return this.state === 'dead' && this.deathTimer > 1000;
  }
}
