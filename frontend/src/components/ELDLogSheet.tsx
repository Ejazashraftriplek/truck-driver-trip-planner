import { useRef, useEffect } from 'react';
import type { ELDLog } from '../types/trip';
import { drawELDLog, CANVAS_W, CANVAS_H } from '../utils/eldCanvas';

interface ELDLogSheetProps {
  log: ELDLog;
}

export default function ELDLogSheet({ log }: ELDLogSheetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    drawELDLog(ctx, log);
  }, [log]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', maxWidth: CANVAS_W, height: 'auto' }}
    />
  );
}
