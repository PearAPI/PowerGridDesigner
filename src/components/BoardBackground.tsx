import { useEffect, useRef } from 'react';
import { useStore } from '@xyflow/react';

const GRID_SIZE = 20;
const BOARD_SIZE = 16;
const DOT_COLOR = '#475569';
const LINE_COLOR = 'rgba(71, 85, 105, 0.4)'; // Slightly bumped opacity for visibility

export default function BoardBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Efficiently subscribe to strictly the viewport transform and dimensions
  const transform = useStore((s) => s.transform); // [x, y, zoom]
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI retina display sharpness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear previous frames
    ctx.clearRect(0, 0, width, height);

    const [tx, ty, zoom] = transform;

    // Calculate visible grid matrix span
    // Adding extra row/col of bleeding to ensure smooth panning
    const startCol = Math.floor(-tx / (GRID_SIZE * zoom)) - 1;
    const endCol = Math.ceil((width - tx) / (GRID_SIZE * zoom)) + 1;
    const startRow = Math.floor(-ty / (GRID_SIZE * zoom)) - 1;
    const endRow = Math.ceil((height - ty) / (GRID_SIZE * zoom)) + 1;

    // ==========================================
    // PASS 1: Render All Minor Dots
    // ==========================================
    ctx.beginPath();
    ctx.fillStyle = DOT_COLOR;
    // Fixed physical pixel size matching standard ReactFlow dots regardless of zoom
    const dotRadius = 1.5; 
    
    let hasOrigin = false;
    let originX = 0;
    let originY = 0;

    for (let col = startCol; col <= endCol; col++) {
      for (let row = startRow; row <= endRow; row++) {
        const x = col * GRID_SIZE * zoom + tx;
        const y = row * GRID_SIZE * zoom + ty;
        
        // Capture exact point of physical origin natively
        if (col === 0 && row === 0) {
          hasOrigin = true;
          originX = x;
          originY = y;
          continue; // Skip rendering standard styling to prevent artifact overlapping
        }
        
        ctx.moveTo(x + dotRadius, y);
        ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
      }
    }
    // Execute filling batch natively for generic dots
    ctx.fill();

    // Secondary explicitly-styled pass for custom center Anchor natively
    if (hasOrigin) {
      ctx.beginPath();
      ctx.fillStyle = '#ef4444'; // Tailwind core Red-500
      const originRadius = dotRadius * 2; // Doubled scaling visibility override
      ctx.arc(originX, originY, originRadius, 0, 2 * Math.PI);
      ctx.fill();
    }

    // ==========================================
    // PASS 2: Render Major Boundary Lines (over dots)
    // ==========================================
    ctx.beginPath();
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 1;

    // Vertical major board boundaries
    for (let col = startCol; col <= endCol; col++) {
      if (col % BOARD_SIZE === 0) {
        const x = col * GRID_SIZE * zoom + tx;
        // Anti-aliasing sub-pixel constraint push
        const pxX = Math.floor(x) + 0.5;
        ctx.moveTo(pxX, 0);
        ctx.lineTo(pxX, height);
      }
    }

    // Horizontal major board boundaries
    for (let row = startRow; row <= endRow; row++) {
      if (row % BOARD_SIZE === 0) {
        const y = row * GRID_SIZE * zoom + ty;
        const pxY = Math.floor(y) + 0.5;
        ctx.moveTo(0, pxY);
        ctx.lineTo(width, pxY);
      }
    }

    // Execute stroking batch natively
    ctx.stroke();

  }, [transform, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="react-flow__background"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1, // Sits exactly beneath edges/nodes within React Flow
      }}
    />
  );
}
