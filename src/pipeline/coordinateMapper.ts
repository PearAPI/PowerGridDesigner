import type { CircuitState } from '../types/circuit';

/**
 * Maps 2D canvas coordinates to 3D Minecraft coordinates.
 * Canvas X → MC X, Canvas Y → MC Z, all at MC Y=0 (ground plane).
 * Normalizes so the schematic starts at (0, 0, 0).
 */
export function canvasToMinecraft(
  canvasX: number,
  canvasY: number,
  offsetX = 0,
  offsetY = 0
): { x: number; y: number; z: number } {
  return {
    x: canvasX - offsetX,
    y: 0,
    z: canvasY - offsetY,
  };
}

/**
 * Find the bounding box offset to normalize positions to start at (0,0).
 */
export function findOffset(state: CircuitState): { x: number; y: number } {
  if (state.components.length === 0) return { x: 0, y: 0 };
  const xs = state.components.map(c => c.position.x);
  const ys = state.components.map(c => c.position.y);
  return { x: Math.min(...xs), y: Math.min(...ys) };
}

/**
 * Map a facing direction to Minecraft block state properties.
 */
export function facingToBlockState(facing: string): Record<string, string> {
  return { facing };
}
