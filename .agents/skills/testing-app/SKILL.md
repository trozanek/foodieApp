# Testing the KWAK Game

## Running the App

```bash
NODE_OPTIONS="--openssl-legacy-provider" npm start
```

The app runs on http://localhost:3000 (or next available port like 3001 if 3000 is in use).

The `NODE_OPTIONS` flag is required because react-scripts 4.0.3 uses an older OpenSSL API incompatible with newer Node.js versions.

## Game Controls

| Key | Action |
|-----|--------|
| A / ArrowLeft | Move left |
| D / ArrowRight | Move right |
| W / Space / ArrowUp | Jump |
| X / Slash | Shoot |
| Q | Switch weapon |
| R | Restart (on game over screen) |

## Core Test Scenarios

1. **Game initialization**: Canvas shows "KWAK" title, HUD with HP/GUN/SCORE/KILLS, cathedral level, player sprite, enemy sprites
2. **Movement**: D key moves player right, camera follows with smooth lerp
3. **Weapon switching**: Q cycles through Blaster → Shotgun → Railgun (HUD updates)
4. **Combat**: X key fires projectiles, enemies take damage and die (KILLS/SCORE increment)
5. **Game over**: When HP reaches 0, dark overlay shows "GAME OVER", final score, enemies killed
6. **Restart**: R key on game over screen resets all state (HP:100, SCORE:0, KILLS:0)
7. **Jump**: W/Space causes player to jump with gravity arc
8. **Jump pads**: Green glowing platforms launch player higher than normal jump

## Testing via Browser Automation

Keyboard events dispatched via JavaScript work for game input:
```javascript
window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyD', bubbles: true}));
setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', {code: 'KeyD', bubbles: true})), 1000);
```

Note: The game uses `e.code` (not `e.key`) for input detection. Use codes like `KeyD`, `KeyW`, `KeyX`, `KeyQ`, `KeyR`, `Space`.

## Architecture Notes

- Game entry: `src/game/GameCanvas.tsx` renders `<canvas>` and manages `Game` lifecycle
- Game loop: Fixed timestep at 60fps in `src/game/engine/GameLoop.ts`
- All audio is procedural via Web Audio API (no external files)
- Music starts on first user interaction (browser autoplay policy)
- Canvas is fixed 960x640, pixel scale 3x
- Level is 4800x1200 pixels with 3 vertical levels (ground + 2 balconies)
