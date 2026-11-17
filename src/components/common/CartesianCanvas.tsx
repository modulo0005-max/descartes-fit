import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FunctionCard } from '../../types/math';
import { drawCartesianGraph } from '../../utils/mathPlotter';
import { FAMILY_METAS } from '../../data/functionCards';

interface CartesianCanvasProps {
  card: FunctionCard;
  width?: number;
  height?: number;
  interactive?: boolean;
  className?: string;
  showPoints?: boolean;
  rangeX?: [number, number];
  rangeY?: [number, number];
}

export const CartesianCanvas: React.FC<CartesianCanvasProps> = ({
  card,
  width = 240,
  height = 160,
  interactive = false,
  className = '',
  showPoints = true,
  rangeX,
  rangeY,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  const familyMeta = FAMILY_METAS[card.family];
  const rx = rangeX || card.domain || [-6, 6];
  const ry = rangeY || [-6, 6];

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    drawCartesianGraph(ctx, card, {
      width,
      height,
      rangeX: rx,
      rangeY: ry,
      lineColor: familyMeta?.color || '#e60012',
      lineWidth: interactive ? 2.5 : 2,
      showGrid: true,
      showAxes: true,
      showLabels: interactive,
      showPoints,
      hoverPoint: hoverCoord,
      theme: 'nintendo',
    });
  }, [card, width, height, interactive, showPoints, rx, ry, familyMeta, hoverCoord]);

  useEffect(() => {
    render();
  }, [render]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const [minX, maxX] = rx;
    const mathX = minX + (px / width) * (maxX - minX);

    try {
      const mathY = card.evaluator(mathX);
      if (mathY !== null && isFinite(mathY)) {
        setHoverCoord({ x: mathX, y: mathY });
      } else {
        setHoverCoord(null);
      }
    } catch {
      setHoverCoord(null);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverCoord(null);
    }
  };

  return (
    <div
      className={`relative inline-block overflow-hidden rounded-md bg-white border border-nintendo-hairline shadow-sm ${className}`}
    >
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="block cursor-crosshair"
      />
      {interactive && hoverCoord && (
        <div className="absolute top-2 right-2 bg-nintendo-fg text-white px-2 py-0.5 rounded text-xs font-mono border border-nintendo-hairline pointer-events-none shadow-md">
          x: {hoverCoord.x.toFixed(2)}, y: {hoverCoord.y.toFixed(2)}
        </div>
      )}
    </div>
  );
};
