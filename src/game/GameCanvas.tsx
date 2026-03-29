import React, { useRef, useEffect } from 'react';
import { Game } from './Game';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 640;

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const game = new Game(canvas);
    gameRef.current = game;
    game.start();

    return () => {
      game.stop();
      gameRef.current = null;
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100vh',
      backgroundColor: '#050008',
      overflow: 'hidden',
    }}>
      <h1 style={{
        color: '#ff00ff',
        fontFamily: 'monospace',
        fontSize: '28px',
        marginBottom: '8px',
        textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff44',
        letterSpacing: '8px',
      }}>
        KWAK
      </h1>
      <canvas
        ref={canvasRef}
        style={{
          border: '2px solid #ff00ff44',
          boxShadow: '0 0 20px #ff00ff22, inset 0 0 20px #00000088',
          imageRendering: 'pixelated',
        }}
        tabIndex={0}
      />
      <p style={{
        color: '#ffffff44',
        fontFamily: 'monospace',
        fontSize: '11px',
        marginTop: '8px',
      }}>
        A/D: Move &bull; W/Space: Jump &bull; LMB: Shoot &bull; RMB: Zoom &bull; Q: Switch Weapon
      </p>
    </div>
  );
};

export default GameCanvas;
