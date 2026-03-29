import { Platform, Rect } from '../types';

export const GRAVITY = 0.6;
export const MAX_FALL_SPEED = 15;
export const FRICTION = 0.85;

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function resolveCollisionY(
  entityRect: Rect,
  vy: number,
  platforms: Platform[]
): { y: number; vy: number; onGround: boolean; onJumpPad: boolean; jumpForce: number } {
  let onGround = false;
  let onJumpPad = false;
  let jumpForce = 0;
  let newY = entityRect.y;
  let newVy = vy;

  for (const platform of platforms) {
    const platRect: Rect = {
      x: platform.x,
      y: platform.y,
      width: platform.width,
      height: platform.height,
    };

    // Check horizontal overlap
    if (entityRect.x + entityRect.width > platRect.x && entityRect.x < platRect.x + platRect.width) {
      // Falling down - land on top
      if (newVy >= 0) {
        const entityBottom = newY + entityRect.height;
        const platTop = platRect.y;
        if (entityBottom >= platTop && entityBottom <= platTop + newVy + 8) {
          newY = platTop - entityRect.height;
          newVy = 0;
          onGround = true;

          if (platform.type === 'jumppad' && platform.jumpForce) {
            onJumpPad = true;
            jumpForce = platform.jumpForce;
          }
        }
      }
      // Moving up - hit ceiling
      else if (newVy < 0) {
        const entityTop = newY;
        const platBottom = platRect.y + platRect.height;
        if (entityTop <= platBottom && entityTop >= platBottom + newVy - 4) {
          if (platform.type === 'solid') {
            newY = platBottom;
            newVy = 0;
          }
        }
      }
    }
  }

  return { y: newY, vy: newVy, onGround, onJumpPad, jumpForce };
}

export function resolveCollisionX(
  entityRect: Rect,
  vx: number,
  platforms: Platform[]
): { x: number; vx: number } {
  let newX = entityRect.x;
  let newVx = vx;

  for (const platform of platforms) {
    if (platform.type === 'jumppad') continue; // jump pads don't block horizontal movement

    const platRect: Rect = {
      x: platform.x,
      y: platform.y,
      width: platform.width,
      height: platform.height,
    };

    // Check vertical overlap
    if (entityRect.y + entityRect.height > platRect.y + 4 && entityRect.y < platRect.y + platRect.height - 4) {
      // Moving right
      if (newVx > 0) {
        const entityRight = newX + entityRect.width;
        if (entityRight >= platRect.x && entityRight <= platRect.x + newVx + 4) {
          newX = platRect.x - entityRect.width;
          newVx = 0;
        }
      }
      // Moving left
      else if (newVx < 0) {
        const entityLeft = newX;
        const platRight = platRect.x + platRect.width;
        if (entityLeft <= platRight && entityLeft >= platRight + newVx - 4) {
          newX = platRight;
          newVx = 0;
        }
      }
    }
  }

  return { x: newX, vx: newVx };
}
